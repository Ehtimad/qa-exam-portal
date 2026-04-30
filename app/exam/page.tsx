import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ExamClient from "./ExamClient";
import { db } from "@/lib/db";
import { examAttempts, examSessions, exams, examQuestions, questions, users } from "@/lib/schema";
import { and, eq, or, isNull, inArray } from "drizzle-orm";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function ExamPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const userId = session.user.id;

  // Block if already submitted
  const [attempt] = await db
    .select({ id: examAttempts.id })
    .from(examAttempts)
    .where(eq(examAttempts.userId, userId))
    .limit(1);

  if (attempt) redirect("/dashboard");

  // Look for active in-progress session
  let examSession = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.userId, userId), eq(examSessions.status, "in_progress")))
    .then((rows) => rows[0] ?? null);

  let timeLimitMinutes: number | null = null;

  if (!examSession) {
    // Find active exam for user's group
    const groupId = session.user.groupId ?? null;

    const activeExams = await db
      .select()
      .from(exams)
      .where(and(
        eq(exams.isActive, true),
        or(eq(exams.groupId, groupId ?? "___no_match___"), isNull(exams.groupId))
      ));

    const exam = activeExams.find((e) => e.groupId === groupId) ?? activeExams.find((e) => !e.groupId) ?? null;

    let questionIds: number[] = [];
    let examId: string | null = null;
    let shuffleQs = true;
    let shuffleOpts = true;

    if (exam) {
      examId = exam.id;
      shuffleQs = exam.shuffleQuestions;
      shuffleOpts = exam.shuffleOptions;
      timeLimitMinutes = exam.timeLimitMinutes;

      const eqRows = await db
        .select({ questionId: examQuestions.questionId })
        .from(examQuestions)
        .where(eq(examQuestions.examId, exam.id));
      questionIds = eqRows.map((r) => r.questionId);
    } else {
      const all = await db.select({ id: questions.id }).from(questions);
      questionIds = all.map((q) => q.id);
    }

    if (questionIds.length === 0) {
      redirect("/dashboard?error=no_exam");
    }

    const questionOrder = shuffleQs ? shuffle(questionIds) : [...questionIds];

    const questionData = await db
      .select({ id: questions.id, options: questions.options })
      .from(questions)
      .where(inArray(questions.id, questionIds));

    const optionOrders: Record<string, number[]> = {};
    for (const q of questionData) {
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

    examSession = newSession;
  } else {
    // Load time limit from exam
    if (examSession.examId) {
      const [exam] = await db.select({ timeLimitMinutes: exams.timeLimitMinutes }).from(exams).where(eq(exams.id, examSession.examId)).limit(1);
      timeLimitMinutes = exam?.timeLimitMinutes ?? null;
    }
  }

  const questionOrder: number[] = JSON.parse(examSession.questionOrder);
  const optionOrders: Record<string, number[]> = JSON.parse(examSession.optionOrders);
  const answers: Record<string, number[]> = JSON.parse(examSession.answers);

  // Load DB questions
  const dbQs = await db
    .select({ id: questions.id, text: questions.text, type: questions.type, options: questions.options, points: questions.points })
    .from(questions)
    .where(inArray(questions.id, questionOrder));

  const parsedQuestions = dbQs.map((q) => ({
    ...q,
    options: JSON.parse(q.options) as string[],
  }));

  return (
    <ExamClient
      session={{
        id: examSession.id,
        examId: examSession.examId,
        questionOrder,
        optionOrders,
        answers,
        tabSwitches: examSession.tabSwitches,
        elapsedSeconds: examSession.elapsedSeconds,
      }}
      questions={parsedQuestions}
      timeLimitMinutes={timeLimitMinutes}
    />
  );
}
