import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exams, examQuestions, groups } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import ExamsClient from "./ExamsClient";

export default async function AdminExamsPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">← Admin</Link>
          <span className="font-semibold text-gray-900">İmtahanlar</span>
          <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-900">İstifadəçilər</Link>
          <Link href="/admin/results" className="text-sm text-gray-500 hover:text-gray-900">Nəticələr</Link>
          <Link href="/admin/questions" className="text-sm text-gray-500 hover:text-gray-900">Suallar</Link>
          <Link href="/admin/analytics" className="text-sm text-gray-500 hover:text-gray-900">Analitika</Link>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ExamsClient initialExams={examsWithCount} groups={allGroups} />
      </div>
    </div>
  );
}
