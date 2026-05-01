import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exams, examQuestions, groups } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import ExamsClient from "./ExamsClient";
import { canManageExams } from "@/lib/rbac";

export default async function AdminExamsPage() {
  const session = await auth();
  if (!session || !canManageExams(session.user.role)) redirect("/admin");

  const allExams = await db.select({
    id: exams.id,
    title: exams.title,
    groupId: exams.groupId,
    timeLimitMinutes: exams.timeLimitMinutes,
    isActive: exams.isActive,
    shuffleQuestions: exams.shuffleQuestions,
    shuffleOptions: exams.shuffleOptions,
    createdAt: exams.createdAt,
    groupName: groups.name,
  })
    .from(exams)
    .leftJoin(groups, eq(exams.groupId, groups.id))
    .orderBy(asc(exams.createdAt));

  const eqRows = await db.select({ examId: examQuestions.examId }).from(examQuestions);
  const countMap: Record<string, number> = {};
  for (const r of eqRows) {
    countMap[r.examId] = (countMap[r.examId] ?? 0) + 1;
  }

  const allGroups = await db.select().from(groups).orderBy(asc(groups.name));

  const examsWithCount = allExams.map((e) => ({ ...e, questionCount: countMap[e.id] ?? 0 }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ExamsClient initialExams={examsWithCount} groups={allGroups} />
    </div>
  );
}
