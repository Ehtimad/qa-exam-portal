import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts, users } from "@/lib/schema";
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

  const [user] = await db
    .select({ approved: users.approved, role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.approved && user?.role !== "admin") {
    return NextResponse.json({ error: "Hesab təsdiq edilməyib" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat formatı" }, { status: 400 });
  }

  // Convert string keys back to number keys for calculateScore
  const numericAnswers: Record<number, number[]> = {};
  for (const [key, val] of Object.entries(parsed.data.answers)) {
    numericAnswers[parseInt(key)] = val;
  }

  const { score, correct } = calculateScore(numericAnswers);

  await db.insert(examAttempts).values({
    userId: session.user.id,
    answers: JSON.stringify(parsed.data.answers),
    score,
    maxScore: MAX_SCORE,
    totalQuestions: questions.length,
    correctAnswers: correct,
    duration: parsed.data.duration,
  });

  return NextResponse.json({ score, maxScore: MAX_SCORE, correct }, { status: 201 });
}
