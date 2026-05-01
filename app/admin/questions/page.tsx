import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions } from "@/lib/schema";
import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">← Admin</Link>
          <span className="font-semibold text-gray-900">Suallar</span>
          <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-900">İstifadəçilər</Link>
          <Link href="/admin/results" className="text-sm text-gray-500 hover:text-gray-900">Nəticələr</Link>
          <Link href="/admin/exams" className="text-sm text-gray-500 hover:text-gray-900">İmtahanlar</Link>
          <Link href="/admin/analytics" className="text-sm text-gray-500 hover:text-gray-900">Analitika</Link>
          <Link href="/admin/groups" className="text-sm text-gray-500 hover:text-gray-900">Qruplar</Link>
          <Link href="/admin/materials" className="text-sm text-gray-500 hover:text-gray-900">Materiallar</Link>
          <Link href="/admin/notifications" className="text-sm text-gray-500 hover:text-gray-900">Bildirişlər</Link>
          <Link href="/admin/advertisements" className="text-sm text-gray-500 hover:text-gray-900">Elanlar</Link>
          <Link href="/messages" className="text-sm text-gray-500 hover:text-gray-900">Mesajlar</Link>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <QuestionsClient initialQuestions={parsed} />
      </div>
    </div>
  );
}
