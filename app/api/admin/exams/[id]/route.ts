import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exams, examQuestions, questions } from "@/lib/schema";
import { eq, asc, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManageExams } from "@/lib/rbac";

async function requireExamManager() {
  const s = await auth();
  return canManageExams(s?.user?.role ?? "") ? s : null;
}

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  groupId: z.string().nullable().optional(),
  timeLimitMinutes: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  questionIds: z.array(z.number().int().positive()).optional(),
});

async function getExamAndCheckOwnership(id: string, session: { user: { id: string; role: string } }) {
  const [exam] = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
  if (!exam) return { exam: null, forbidden: false };
  const isTeacher = session.user.role === "teacher";
  if (isTeacher && exam.teacherId !== session.user.id) return { exam: null, forbidden: true };
  return { exam, forbidden: false };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireExamManager();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const { exam, forbidden } = await getExamAndCheckOwnership(id, session);
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!exam) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });

  const eqRows = await db.select({ questionId: examQuestions.questionId })
    .from(examQuestions).where(eq(examQuestions.examId, id));
  const qIds = eqRows.map((r) => r.questionId);

  // For teacher: show only their own questions + already assigned questions
  const isTeacher = session.user.role === "teacher";
  const allQuestions = isTeacher
    ? await db.select().from(questions)
        .where(eq(questions.teacherId, session.user.id))
        .orderBy(asc(questions.lectureId), asc(questions.id))
    : await db.select().from(questions)
        .where(isNull(questions.deletedAt))
        .orderBy(asc(questions.lectureId), asc(questions.id));

  return NextResponse.json({
    ...exam,
    questionIds: qIds,
    allQuestions: allQuestions.map((q) => ({
      ...q,
      options: JSON.parse(q.options),
      correctAnswers: JSON.parse(q.correctAnswers),
    })),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireExamManager();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const { exam, forbidden } = await getExamAndCheckOwnership(id, session);
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!exam) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Məlumatlar düzgün deyil" }, { status: 400 });

  const { questionIds, ...examData } = parsed.data;
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(examData)) {
    if (v !== undefined) updates[k] = v;
  }

  if (Object.keys(updates).length > 0) {
    await db.update(exams).set(updates).where(eq(exams.id, id));
  }

  if (questionIds !== undefined) {
    await db.delete(examQuestions).where(eq(examQuestions.examId, id));
    if (questionIds.length > 0) {
      await db.insert(examQuestions).values(questionIds.map((qId) => ({ examId: id, questionId: qId })));
    }
  }

  revalidatePath("/admin/exams");
  return NextResponse.json({ success: true });
}

// SOFT DELETE — never hard-deletes an exam
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireExamManager();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const { exam, forbidden } = await getExamAndCheckOwnership(id, session);
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!exam) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });

  await db.update(exams).set({ deletedAt: new Date() }).where(eq(exams.id, id));
  revalidatePath("/admin/exams");
  return NextResponse.json({ success: true });
}
