import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, examQuestions, exams, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { canUploadQuestions } from "@/lib/rbac";

async function requireAdmin() {
  const s = await auth();
  return canUploadQuestions(s?.user?.role ?? "") ? s : null;
}

// Supported CSV formats:
//
// NEW (current template):
//   id, text, type, option_1..option_6, correct_answers, points, explanation?, exam_ids?
//
// OLD (backwards-compat):
//   id, lecture_id, text, type, option_1..option_6, correct_answers, difficulty, points, explanation?, exam_id?
//
// Auto-detected by checking whether col[2] is "single"/"multiple" (new) or col[3] is (old).
// correct_answers: semicolon-separated 1-based indices ("1" = first option, "1;3" = first and third)
// exam_ids: semicolon-separated exam UUIDs

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fayl tapılmadı" }, { status: 400 });

  const rawText = await file.text();
  const lines = rawText
    .replace(/^﻿/, "")           // strip UTF-8 BOM
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#")); // skip empty + comment lines

  if (lines.length === 0) return NextResponse.json({ error: "Fayl boşdur" }, { status: 400 });

  const firstCols = parseCsvLine(lines[0]);
  const isHeader = firstCols[0].toLowerCase() === "id" || firstCols[1]?.toLowerCase() === "text" || firstCols[2]?.toLowerCase() === "text";
  const dataLines = isHeader ? lines.slice(1) : lines;

  const allIds = await db.select({ id: questions.id }).from(questions);
  let nextId = allIds.length > 0 ? Math.max(...allIds.map((q) => q.id)) + 1 : 1;

  // Pre-fetch valid exam IDs to prevent FK violations on exam_questions inserts
  const allExamRows = await db.select({ id: exams.id }).from(exams);
  const validExamIds = new Set(allExamRows.map((e) => e.id));

  // Pre-fetch teachers for email→id resolution
  const allTeachers = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.role, "teacher"));
  const teacherByEmail = new Map(allTeachers.map((t) => [t.email.toLowerCase(), t.id]));
  const teacherById = new Set(allTeachers.map((t) => t.id));

  let imported = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const lineNum = isHeader ? i + 2 : i + 1;
    const cols = parseCsvLine(dataLines[i]);

    if (cols.length < 10) {
      errors.push(`Sətir ${lineNum}: kifayət qədər sütun yoxdur (ən az 10 lazımdır, ${cols.length} tapıldı)`);
      continue;
    }

    try {
      // Detect format by position of type column
      const col2 = cols[2]?.toLowerCase();
      const col3 = cols[3]?.toLowerCase();
      const isOldFormat = (col3 === "single" || col3 === "multiple");
      const isNewFormat = (col2 === "single" || col2 === "multiple");

      if (!isNewFormat && !isOldFormat) {
        errors.push(`Sətir ${lineNum}: format tanınmadı (tip "single" və ya "multiple" olmalıdır)`);
        continue;
      }

      let idStr: string, text: string, type: string, rest: string[];

      if (isOldFormat) {
        // Old: id, lecture_id, text, type, opt1..opt6, correct, difficulty, points, explanation?, exam_id?, teacher?
        [idStr, , text, type, ...rest] = cols;
        // rest: opt1..opt6(0-5), correct(6), difficulty(7), points(8), explanation(9), exam_id(10), teacher(11)
        const options = rest.slice(0, 6).filter((o) => o.trim() !== "");
        const correctRaw = rest[6] ?? "";
        const pointsStr = rest[8] ?? "5";
        const explanation = rest[9]?.trim() || null;
        const examIdsRaw = rest[10]?.trim() ?? "";
        const examIds = examIdsRaw ? examIdsRaw.split(";").map((s) => s.trim()).filter(Boolean) : [];
        const teacherRaw = rest[11]?.trim() ?? "";

        const result = await upsertQuestion({
          idStr, text, type, options, correctRaw, points: parseInt(pointsStr),
          explanation, examIds, lineNum, allIds, nextId, validExamIds,
          teacherRaw, teacherByEmail, teacherById,
        });
        if (result.error) { errors.push(result.error); continue; }
        if (result.warning) { errors.push(result.warning); }
        if (result.wasNew) { imported++; if (result.id === nextId) { nextId++; allIds.push({ id: result.id }); } }
        else { updated++; }

      } else {
        // New: id, text, type, opt1..opt6, correct, points, explanation?, exam_ids?, teacher?
        [idStr, text, type, ...rest] = cols;
        // rest: opt1..opt6(0-5), correct(6), points(7), explanation(8), exam_ids(9), teacher(10)
        const options = rest.slice(0, 6).filter((o) => o.trim() !== "");
        const correctRaw = rest[6] ?? "";
        const pointsStr = rest[7] ?? "5";
        const explanation = rest[8]?.trim() || null;
        const examIdsRaw = rest[9]?.trim() ?? "";
        const examIds = examIdsRaw ? examIdsRaw.split(";").map((s) => s.trim()).filter(Boolean) : [];
        const teacherRaw = rest[10]?.trim() ?? "";

        const result = await upsertQuestion({
          idStr, text, type, options, correctRaw, points: parseInt(pointsStr),
          explanation, examIds, lineNum, allIds, nextId, validExamIds,
          teacherRaw, teacherByEmail, teacherById,
        });
        if (result.error) { errors.push(result.error); continue; }
        if (result.warning) { errors.push(result.warning); }
        if (result.wasNew) { imported++; if (result.id === nextId) { nextId++; allIds.push({ id: result.id }); } }
        else { updated++; }
      }
    } catch (e) {
      errors.push(`Sətir ${lineNum}: ${String(e).slice(0, 100)}`);
    }
  }

  revalidatePath("/admin/questions");
  return NextResponse.json({ imported, updated, errors, total: imported + updated });
}

async function upsertQuestion(p: {
  idStr: string; text: string; type: string;
  options: string[]; correctRaw: string; points: number;
  explanation: string | null; examIds: string[];
  lineNum: number; allIds: { id: number }[]; nextId: number;
  validExamIds: Set<string>;
  teacherRaw?: string;
  teacherByEmail?: Map<string, string>;
  teacherById?: Set<string>;
}): Promise<{ error?: string; warning?: string; wasNew?: boolean; id?: number }> {
  const { idStr, text, type, options, correctRaw, points, explanation, examIds, lineNum, allIds, nextId, validExamIds, teacherRaw = "", teacherByEmail, teacherById } = p;

  if (!text.trim()) return { error: `Sətir ${lineNum}: sual mətni boşdur` };
  if (!["single", "multiple"].includes(type)) return { error: `Sətir ${lineNum}: type "single" və ya "multiple" olmalıdır` };
  if (isNaN(points) || points < 1) return { error: `Sətir ${lineNum}: points yanlışdır` };
  if (options.length < 2) return { error: `Sətir ${lineNum}: ən az 2 variant lazımdır` };

  const correctAnswers = correctRaw
    .split(";")
    .map((n) => parseInt(n.trim()) - 1)
    .filter((n) => !isNaN(n) && n >= 0 && n < options.length);

  if (correctAnswers.length === 0) return { error: `Sətir ${lineNum}: düzgün cavab göstərilməyib` };

  const id = idStr.trim() ? parseInt(idStr) : nextId;
  if (isNaN(id) || id < 1) return { error: `Sətir ${lineNum}: id yanlışdır` };

  // Resolve teacher_id from teacher_email or direct teacher_id
  let teacherId: string | null = null;
  const warnings: string[] = [];
  if (teacherRaw) {
    if (teacherRaw.includes("@")) {
      const found = teacherByEmail?.get(teacherRaw.toLowerCase());
      if (found) { teacherId = found; }
      else { warnings.push(`müəllim e-poçtu tapılmadı: ${teacherRaw}`); }
    } else {
      if (teacherById?.has(teacherRaw)) { teacherId = teacherRaw; }
      else { warnings.push(`müəllim ID tapılmadı: ${teacherRaw}`); }
    }
  }

  const values = {
    lectureId: 1,
    text: text.trim(),
    type: type as "single" | "multiple",
    options: JSON.stringify(options),
    correctAnswers: JSON.stringify(correctAnswers),
    difficulty: "medium" as const,
    points,
    explanation: explanation?.trim() || null,
    ...(teacherRaw ? { teacherId } : {}),
  };

  const wasExisting = allIds.some((r) => r.id === id);
  await db.insert(questions).values({ id, ...values })
    .onConflictDoUpdate({ target: questions.id, set: values });

  const invalidExamIds = examIds.filter((eid) => !validExamIds.has(eid));
  const validIds = examIds.filter((eid) => validExamIds.has(eid));

  for (const examId of validIds) {
    await db.insert(examQuestions).values({ examId, questionId: id }).onConflictDoNothing();
  }

  if (invalidExamIds.length > 0) {
    warnings.push(`aşağıdakı exam_id-lər tapılmadı (keçirildi): ${invalidExamIds.join(", ")}`);
  }

  const warning = warnings.length > 0
    ? `Sətir ${lineNum}: sual əlavə edildi, lakin — ${warnings.join("; ")}`
    : undefined;

  return { wasNew: !wasExisting, id, warning };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
