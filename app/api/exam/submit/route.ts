import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts } from "@/lib/schema";
import { calculateScore, questions, MAX_SCORE } from "@/lib/questions";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  answers: z.record(z.string(), z.array(z.number())),
  duration: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [existing] = await db
    .select({ id: examAttempts.id })
    .from(examAttempts)
    .where(eq(examAttempts.userId, session.user.id))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Siz artıq imtahanda iştirak etmisiniz" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat formatı" }, { status: 400 });
  }

  const numericAnswers: Record<number, number[]> = {};
  for (const [key, val] of Object.entries(parsed.data.answers)) {
    numericAnswers[parseInt(key)] = val;
  }

  const { score, correct } = calculateScore(numericAnswers);

  const [inserted] = await db.insert(examAttempts).values({
    userId: session.user.id,
    answers: JSON.stringify(parsed.data.answers),
    score,
    maxScore: MAX_SCORE,
    totalQuestions: questions.length,
    correctAnswers: correct,
    duration: parsed.data.duration,
  }).returning({ id: examAttempts.id });

  return NextResponse.json({ score, maxScore: MAX_SCORE, correct, attemptId: inserted.id }, { status: 201 });
}
