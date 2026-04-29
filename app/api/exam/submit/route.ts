import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts, examSessions, questions } from "@/lib/schema";
import { calculateExamScore } from "@/lib/scoring";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  answers: z.record(z.string(), z.array(z.number())).optional(),
  tabSwitches: z.number().int().min(0).optional(),
  duration: z.number().optional(),
});

const MAX_SCORE = 500;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Check for existing submitted attempt
  const [existing] = await db
    .select({ id: examAttempts.id })
    .from(examAttempts)
    .where(eq(examAttempts.userId, userId))
    .limit(1);

  if (existing) return NextResponse.json({ error: "Siz artıq imtahanda iştirak etmisiniz" }, { status: 409 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Yanlış məlumat formatı" }, { status: 400 });

  // Load active session
  const [examSession] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.userId, userId), eq(examSessions.status, "in_progress")))
    .limit(1);

  let questionOrder: number[];
  let optionOrders: Record<string, number[]>;
  let answers: Record<string, number[]>;
  let tabSwitches: number;
  let sessionId: string | null = null;
  let examId: string | null = null;

  if (examSession) {
    sessionId = examSession.id;
    examId = examSession.examId;
    questionOrder = JSON.parse(examSession.questionOrder);
    optionOrders = JSON.parse(examSession.optionOrders);
    // Merge session answers with any final answers sent in body
    answers = { ...JSON.parse(examSession.answers), ...(parsed.data.answers ?? {}) };
    tabSwitches = examSession.tabSwitches + (parsed.data.tabSwitches ?? 0);
  } else {
    // Legacy path: no session (old-style direct submission)
    if (!parsed.data.answers) return NextResponse.json({ error: "Cavablar tapılmadı" }, { status: 400 });
    answers = parsed.data.answers;
    const allQs = await db.select({ id: questions.id }).from(questions);
    questionOrder = allQs.map((q) => q.id);
    optionOrders = {};
    for (const q of allQs) {
      const opts = JSON.parse((await db.select({ options: questions.options }).from(questions).where(eq(questions.id, q.id)).limit(1))[0]?.options ?? "[]");
      optionOrders[String(q.id)] = Array.from({ length: opts.length }, (_, i) => i);
    }
    tabSwitches = parsed.data.tabSwitches ?? 0;
  }

  // Load questions from DB
  const dbQs = await db.select({
    id: questions.id,
    type: questions.type,
    points: questions.points,
    correctAnswers: questions.correctAnswers,
  }).from(questions).where(inArray(questions.id, questionOrder));

  const { score, correctCount } = calculateExamScore(answers, questionOrder, optionOrders, dbQs, MAX_SCORE);

  const [inserted] = await db.insert(examAttempts).values({
    id: crypto.randomUUID(),
    userId,
    examId,
    answers: JSON.stringify(answers),
    score,
    maxScore: MAX_SCORE,
    totalQuestions: questionOrder.length,
    correctAnswers: correctCount,
    tabSwitches,
    questionOrder: JSON.stringify(questionOrder),
    optionOrders: JSON.stringify(optionOrders),
    duration: parsed.data.duration,
  }).returning({ id: examAttempts.id });

  // Mark session as submitted
  if (sessionId) {
    await db.update(examSessions).set({ status: "submitted" }).where(eq(examSessions.id, sessionId));
  }

  return NextResponse.json({ score, maxScore: MAX_SCORE, correct: correctCount, attemptId: inserted.id }, { status: 201 });
}
