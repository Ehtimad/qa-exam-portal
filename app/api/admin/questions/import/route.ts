import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions } from "@/lib/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const s = await auth();
  return s?.user?.role === "admin" ? s : null;
}

// CSV format: id,lectureId,type,difficulty,points,text,opt1,opt2,...,optN,correct (semicolon-separated correct answer indices)
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fayl tapılmadı" }, { status: 400 });

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));

  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < 7) { errors.push(`Sətir ${i + 1}: kifayət qədər sütun yoxdur`); continue; }

    try {
      const [idStr, lectureIdStr, type, difficulty, pointsStr, ...rest] = cols;
      const correctRaw = rest[rest.length - 1];
      const opts = rest.slice(0, -1);

      const id = parseInt(idStr);
      const lectureId = parseInt(lectureIdStr);
      const points = parseInt(pointsStr);
      const correctAnswers = correctRaw.split(";").map((n) => parseInt(n.trim()));

      if (isNaN(id) || isNaN(lectureId) || isNaN(points)) {
        errors.push(`Sətir ${i + 1}: rəqəm formatı yanlışdır`);
        continue;
      }
      if (!["single", "multiple"].includes(type)) {
        errors.push(`Sətir ${i + 1}: type "single" və ya "multiple" olmalıdır`);
        continue;
      }

      // Upsert
      const [existing] = await db.select({ id: questions.id }).from(questions).where(eq(questions.id, id)).limit(1);
      if (existing) {
        await db.update(questions).set({
          lectureId, text: opts[0], type: type as "single" | "multiple",
          options: JSON.stringify(opts.slice(1)),
          correctAnswers: JSON.stringify(correctAnswers),
          difficulty: difficulty as "easy" | "medium" | "hard",
          points,
        }).where(eq(questions.id, id));
      } else {
        await db.insert(questions).values({
          id, lectureId, text: opts[0], type: type as "single" | "multiple",
          options: JSON.stringify(opts.slice(1)),
          correctAnswers: JSON.stringify(correctAnswers),
          difficulty: difficulty as "easy" | "medium" | "hard",
          points,
        });
      }
      imported++;
    } catch (e) {
      errors.push(`Sətir ${i + 1}: ${String(e)}`);
    }
  }

  return NextResponse.json({ imported, errors });
}
