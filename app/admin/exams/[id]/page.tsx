import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exams, examQuestions, questions } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ExamQuestionsClient from "./ExamQuestionsClient";

export default async function AdminExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  const { id } = await params;

  const [exam] = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
  if (!exam) notFound();

  const eqRows = await db.select({ questionId: examQuestions.questionId })
    .from(examQuestions).where(eq(examQuestions.examId, id));
  const assignedIds = new Set(eqRows.map((r) => r.questionId));

  const allQs = await db.select().from(questions).orderBy(asc(questions.lectureId), asc(questions.id));
  const parsed = allQs.map((q) => ({
    ...q,
    options: JSON.parse(q.options) as string[],
    correctAnswers: JSON.parse(q.correctAnswers) as number[],
    assigned: assignedIds.has(q.id),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <Link href="/admin/exams" className="text-sm text-gray-600 hover:text-gray-900">← İmtahanlar</Link>
          <span className="font-semibold text-gray-900">{exam.title} — Suallar</span>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ExamQuestionsClient examId={id} examTitle={exam.title} allQuestions={parsed} />
      </div>
    </div>
  );
}
