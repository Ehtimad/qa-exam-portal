import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, examQuestions } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { canUploadQuestions } from "@/lib/rbac";

async function requireAdmin() {
  const s = await auth();
  return canUploadQuestions(s?.user?.role ?? "") ? s : null;
}

// Template CSV format (header row optional):
// id,lecture_id,text,type,option_1,option_2,option_3,option_4,option_5,option_6,correct_answers,difficulty,points,explanation
// correct_answers: semicolon-separated 1-based option indices (e.g. "1" = first option, "1;3" = first and third)
// id: leave empty to auto-assign
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fayl tapılmadı" }, { status: 400 });

  const rawText = await file.text();
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  if (lines.length === 0) return NextResponse.json({ error: "Fayl boşdur" }, { status: 400 });

  // Detect if first row is a header
  const firstCols = parseCsvLine(lines[0]);
  const hasHeader = firstCols[0].toLowerCase() === "id" || firstCols[2]?.toLowerCase() === "text";
  const dataLines = hasHeader ? lines.slice(1) : lines;

  // Get max existing id for auto-increment
  const allIds = await db.select({ id: questions.id }).from(questions);
  let nextId = allIds.length > 0 ? Math.max(...allIds.map((q) => q.id)) + 1 : 1;

  let imported = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const lineNum = hasHeader ? i + 2 : i + 1;
    const cols = parseCsvLine(dataLines[i]);

    if (cols.length < 12) {
      errors.push(`Sətir ${lineNum}: kifayət qədər sütun yoxdur (ən az 12 lazımdır, ${cols.length} tapıldı)`);
      continue;
    }

    try {
      const [idStr, lectureIdStr, text, type, ...rest] = cols;
      // rest: option_1..option_6, correct_answers, difficulty, points, explanation, exam_id(optional)
      const options = rest.slice(0, 6).filter((o) => o.trim() !== "");
      const correctRaw = rest[6] ?? "";
      const difficulty = rest[7] ?? "medium";
      const pointsStr = rest[8] ?? "5";
      const explanation = rest[9] ?? null;
      const examId = rest[10]?.trim() || null;

      const lectureId = parseInt(lectureIdStr);
      const points = parseInt(pointsStr);

      if (!text.trim()) { errors.push(`Sətir ${lineNum}: sual mətni boşdur`); continue; }
      if (isNaN(lectureId) || lectureId < 1) { errors.push(`Sətir ${lineNum}: lecture_id yanlışdır`); continue; }
      if (!["single", "multiple"].includes(type)) { errors.push(`Sətir ${lineNum}: type "single" və ya "multiple" olmalıdır`); continue; }
      if (!["easy", "medium", "hard"].includes(difficulty)) { errors.push(`Sətir ${lineNum}: difficulty "easy"/"medium"/"hard" olmalıdır`); continue; }
      if (isNaN(points) || points < 1) { errors.push(`Sətir ${lineNum}: points yanlışdır`); continue; }
      if (options.length < 2) { errors.push(`Sətir ${lineNum}: ən az 2 variant lazımdır`); continue; }

      // correct_answers: 1-based → 0-based
      const correctAnswers = correctRaw
        .split(";")
        .map((n) => parseInt(n.trim()) - 1)
        .filter((n) => !isNaN(n) && n >= 0 && n < options.length);

      if (correctAnswers.length === 0) { errors.push(`Sətir ${lineNum}: düzgün cavab göstərilməyib`); continue; }

      const id = idStr.trim() ? parseInt(idStr) : nextId;
      if (isNaN(id) || id < 1) { errors.push(`Sətir ${lineNum}: id yanlışdır`); continue; }

      const values = {
        lectureId,
        text: text.trim(),
        type: type as "single" | "multiple",
        options: JSON.stringify(options),
        correctAnswers: JSON.stringify(correctAnswers),
        difficulty: difficulty as "easy" | "medium" | "hard",
        points,
        explanation: explanation?.trim() || null,
      };

      const wasExisting = allIds.some((r) => r.id === id);

      await db.insert(questions).values({ id, ...values })
        .onConflictDoUpdate({ target: questions.id, set: values });

      if (wasExisting) { updated++; }
      else { imported++; if (id === nextId) nextId++; allIds.push({ id }); }

      if (examId) {
        await db.insert(examQuestions)
          .values({ examId, questionId: id })
          .onConflictDoNothing();
      }

    } catch (e) {
      errors.push(`Sətir ${lineNum}: ${String(e).slice(0, 100)}`);
    }
  }

  revalidatePath("/admin/questions");
  return NextResponse.json({ imported, updated, errors, total: imported + updated });
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
