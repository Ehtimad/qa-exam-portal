import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions } from "@/lib/schema";
import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import QuestionsClient from "./QuestionsClient";
import { canManageQuestions } from "@/lib/rbac";

export default async function AdminQuestionsPage() {
  const session = await auth();
  if (!session || !canManageQuestions(session.user.role)) redirect("/admin");

  const all = await db.select().from(questions).orderBy(asc(questions.lectureId), asc(questions.id));
  const parsed = all.map((q) => ({
    ...q,
    options: JSON.parse(q.options) as string[],
    correctAnswers: JSON.parse(q.correctAnswers) as number[],
    explanation: q.explanation ?? null,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <QuestionsClient initialQuestions={parsed} />
    </div>
  );
}
