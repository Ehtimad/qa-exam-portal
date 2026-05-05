import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, users } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import QuestionsClient from "./QuestionsClient";
import { canManageQuestions } from "@/lib/rbac";

export default async function AdminQuestionsPage() {
  const session = await auth();
  if (!session || !canManageQuestions(session.user.role)) redirect("/admin");

  const isAdmin = session.user.role !== "teacher";

  const all = await db.select().from(questions).orderBy(asc(questions.lectureId), asc(questions.id));
  const parsed = all.map((q) => ({
    ...q,
    options: JSON.parse(q.options) as string[],
    correctAnswers: JSON.parse(q.correctAnswers) as number[],
    explanation: q.explanation ?? null,
  }));

  const teacherList = isAdmin
    ? await db.select({ id: users.id, name: users.name }).from(users)
        .where(eq(users.role, "teacher")).orderBy(asc(users.name))
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <QuestionsClient
        initialQuestions={parsed}
        isAdmin={isAdmin}
        teachers={teacherList.map((t) => ({ id: t.id, name: t.name ?? t.id }))}
      />
    </div>
  );
}
