import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examSessions, examAttempts, exams, examQuestions, questions, users } from "@/lib/schema";
import { eq, and, or, isNull } from "drizzle-orm";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Return active in-progress session if exists
  const [existing] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.userId, session.user.id), eq(examSessions.status, "in_progress")))
    .limit(1);

  if (!existing) return NextResponse.json({ session: null });

  return NextResponse.json({
    session: {
      ...existing,
      questionOrder: JSON.parse(existing.questionOrder),
      optionOrders: JSON.parse(existing.optionOrders),
      answers: JSON.parse(existing.answers),
    },
  });
}

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Block if already has a submitted attempt
  const [attempt] = await db
    .select({ id: examAttempts.id })
    .from(examAttempts)
    .where(eq(examAttempts.userId, userId))
    .limit(1);

  if (attempt) return NextResponse.json({ error: "Siz artıq imtahanda iştirak etmisiniz" }, { status: 409 });

  // Abandon any stale in-progress session
  await db
    .update(examSessions)
    .set({ status: "abandoned" })
    .where(and(eq(examSessions.userId, userId), eq(examSessions.status, "in_progress")));

  // Find active exam for user's group (or global exam)
  const groupId = session.user.groupId ?? null;

  const activeExams = await db
    .select()
    .from(exams)
    .where(and(
      eq(exams.isActive, true),
      or(eq(exams.groupId, groupId ?? ""), isNull(exams.groupId))
    ));

  // Prefer group-specific exam, fall back to global
  const exam = activeExams.find((e) => e.groupId === groupId) ?? activeExams.find((e) => !e.groupId) ?? null;

  let questionIds: number[] = [];
  let examId: string | null = null;
  let shuffleOpts = true;
  let shuffleQs = true;

  if (exam) {
    examId = exam.id;
    shuffleQs = exam.shuffleQuestions;
    shuffleOpts = exam.shuffleOptions;

    const eqRows = await db
      .select({ questionId: examQuestions.questionId })
      .from(examQuestions)
      .where(eq(examQuestions.examId, exam.id));

    questionIds = eqRows.map((r) => r.questionId);
  } else {
    // Fallback: all questions from DB
    const all = await db.select({ id: questions.id }).from(questions);
    questionIds = all.map((q) => q.id);
  }

  if (questionIds.length === 0) {
    return NextResponse.json({ error: "İmtahan üçün sual tapılmadı" }, { status: 404 });
  }

  // Build question order
  const questionOrder = shuffleQs ? shuffle(questionIds) : [...questionIds];

  // Build option orders: for each question, shuffle option indices
  const questionData = await db
    .select({ id: questions.id, options: questions.options })
    .from(questions);

  const optionOrders: Record<string, number[]> = {};
  for (const q of questionData) {
    if (!questionIds.includes(q.id)) continue;
    const opts = JSON.parse(q.options) as string[];
    const indices = Array.from({ length: opts.length }, (_, i) => i);
    optionOrders[String(q.id)] = shuffleOpts ? shuffle(indices) : indices;
  }

  const [newSession] = await db.insert(examSessions).values({
    id: crypto.randomUUID(),
    userId,
    examId,
    questionOrder: JSON.stringify(questionOrder),
    optionOrders: JSON.stringify(optionOrders),
    answers: "{}",
    tabSwitches: 0,
    status: "in_progress",
  }).returning();

  return NextResponse.json({
    session: {
      ...newSession,
      questionOrder,
      optionOrders,
      answers: {},
    },
  }, { status: 201 });
}
