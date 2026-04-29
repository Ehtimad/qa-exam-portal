import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, groups } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRow } from "./UserActions";
import { Suspense } from "react";
import UsersFilterBar from "./UsersFilterBar";

type Student = typeof users.$inferSelect;
type Group = typeof groups.$inferSelect;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  const { q = "", group = "", status = "" } = await searchParams;

  let allStudents: Student[] = [];
  let allGroups: Group[] = [];
  let dbError = false;

  try {
    allStudents = await db
      .select()
      .from(users)
      .where(eq(users.role, "student"))
      .orderBy(users.createdAt);
    allGroups = await db.select().from(groups).orderBy(asc(groups.name));
  } catch {
    dbError = true;
  }

  const filtered = allStudents.filter((s) => {
    const matchQ = !q || (s.name?.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase()));
    const matchGroup = !group || s.groupId === group || s.groupName === group;
    const matchStatus = !status ||
      (status === "pending" && !s.emailVerified) ||
      (status === "verified" && !!s.emailVerified) ||
      (status === "blocked" && s.isBlocked);
    return matchQ && matchGroup && matchStatus;
  });

  const pendingCount = allStudents.filter((s) => !s.emailVerified).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6 flex-wrap">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">← Admin</Link>
          <span className="font-semibold text-gray-900">İstifadəçilər</span>
          <Link href="/admin/results" className="text-sm text-gray-500 hover:text-gray-900">Nəticələr</Link>
          <Link href="/admin/questions" className="text-sm text-gray-500 hover:text-gray-900">Suallar</Link>
          <Link href="/admin/exams" className="text-sm text-gray-500 hover:text-gray-900">İmtahanlar</Link>
          <Link href="/admin/analytics" className="text-sm text-gray-500 hover:text-gray-900">Analitika</Link>
          <Link href="/admin/groups" className="text-sm text-gray-500 hover:text-gray-900">Qruplar</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {dbError ? (
          <div className="card text-center py-10">
            <p className="text-amber-700 font-medium mb-2">Verilənlər bazası yenilənir...</p>
            <p className="text-gray-500 text-sm">Bir neçə saniyə sonra səhifəni yeniləyin.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tələbələr</h1>
                {pendingCount > 0 && (
                  <p className="text-amber-700 text-sm mt-1">
                    {pendingCount} tələbə admin təsdiqini gözləyir
                  </p>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {filtered.length} / {allStudents.length} tələbə
              </div>
            </div>

            <Suspense>
              <UsersFilterBar groups={allGroups} />
            </Suspense>

            <div className="card overflow-hidden">
              {filtered.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  {allStudents.length === 0 ? "Hələ heç bir tələbə yoxdur" : "Filter nəticəsi tapılmadı"}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-3 py-3 text-gray-500 font-medium">Ad Soyad</th>
                        <th className="text-left px-3 py-3 text-gray-500 font-medium">Qrup</th>
                        <th className="text-left px-3 py-3 text-gray-500 font-medium">E-poçt</th>
                        <th className="text-left px-3 py-3 text-gray-500 font-medium">Status</th>
                        <th className="text-left px-3 py-3 text-gray-500 font-medium">Tarix</th>
                        <th className="text-right px-3 py-3 text-gray-500 font-medium">Əməliyyatlar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((student) => (
                        <UserRow key={student.id} student={student} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
