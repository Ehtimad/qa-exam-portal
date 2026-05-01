import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, groups } from "@/lib/schema";
import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRow } from "./UserActions";
import { Suspense } from "react";
import UsersFilterBar from "./UsersFilterBar";
import { canManageUsers, ROLE_LABELS, ROLE_COLORS } from "@/lib/rbac";

type DBUser = typeof users.$inferSelect;
type Group = typeof groups.$inferSelect;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string; status?: string; role?: string }>;
}) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/admin");

  const { q = "", group = "", status = "", role: roleFilter = "" } = await searchParams;

  let allUsers: DBUser[] = [];
  let allGroups: Group[] = [];
  let dbError = false;

  try {
    allUsers = await db.select().from(users).orderBy(asc(users.createdAt));
    allGroups = await db.select().from(groups).orderBy(asc(groups.name));
  } catch {
    dbError = true;
  }

  const students   = allUsers.filter((u) => u.role === "student");
  const staffUsers = allUsers.filter((u) => u.role !== "student");

  function filterList(list: DBUser[]) {
    return list.filter((s) => {
      const matchQ      = !q || (s.name?.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase()));
      const matchGroup  = !group || s.groupId === group || s.groupName === group;
      const matchRole   = !roleFilter || s.role === roleFilter;
      const matchStatus = !status ||
        (status === "pending"  && !s.emailVerified) ||
        (status === "verified" && !!s.emailVerified) ||
        (status === "blocked"  && s.isBlocked);
      return matchQ && matchGroup && matchRole && matchStatus;
    });
  }

  const filteredStudents = filterList(students);
  const filteredStaff    = filterList(staffUsers);
  const pendingCount     = students.filter((s) => !s.emailVerified).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6 flex-wrap">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">← Admin</Link>
          <span className="font-semibold text-gray-900">İstifadəçilər</span>
          <Link href="/admin/results"   className="text-sm text-gray-500 hover:text-gray-900">Nəticələr</Link>
          <Link href="/admin/questions" className="text-sm text-gray-500 hover:text-gray-900">Suallar</Link>
          <Link href="/admin/exams"     className="text-sm text-gray-500 hover:text-gray-900">İmtahanlar</Link>
          <Link href="/admin/analytics" className="text-sm text-gray-500 hover:text-gray-900">Analitika</Link>
          <Link href="/admin/groups"    className="text-sm text-gray-500 hover:text-gray-900">Qruplar</Link>
          <Link href="/admin/materials" className="text-sm text-gray-500 hover:text-gray-900">Materiallar</Link>
          <Link href="/admin/notifications" className="text-sm text-gray-500 hover:text-gray-900">Bildirişlər</Link>
          <Link href="/admin/advertisements" className="text-sm text-gray-500 hover:text-gray-900">Elanlar</Link>
          <Link href="/messages" className="text-sm text-gray-500 hover:text-gray-900">Mesajlar</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {dbError ? (
          <div className="card text-center py-10">
            <p className="text-amber-700 font-medium mb-2">Verilənlər bazası yenilənir...</p>
            <p className="text-gray-500 text-sm">Bir neçə saniyə sonra səhifəni yeniləyin.</p>
          </div>
        ) : (
          <>
            {/* ── Staff section ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">Sistem İşçiləri
                  <span className="ml-2 text-sm font-normal text-gray-400">({filteredStaff.length})</span>
                </h2>
              </div>
              <div className="card overflow-hidden">
                {filteredStaff.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">Sistem işçisi yoxdur</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-3 py-3 text-gray-500 font-medium">Ad Soyad</th>
                          <th className="text-left px-3 py-3 text-gray-500 font-medium">Rol</th>
                          <th className="text-left px-3 py-3 text-gray-500 font-medium">E-poçt</th>
                          <th className="text-left px-3 py-3 text-gray-500 font-medium">Status</th>
                          <th className="text-left px-3 py-3 text-gray-500 font-medium">Tarix</th>
                          <th className="text-right px-3 py-3 text-gray-500 font-medium">Əməliyyatlar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStaff.map((u) => (
                          <UserRow key={u.id} student={u} showRole />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* ── Students section ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Tələbələr
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      {filteredStudents.length} / {students.length}
                    </span>
                  </h2>
                  {pendingCount > 0 && (
                    <p className="text-amber-700 text-sm mt-0.5">{pendingCount} tələbə admin təsdiqini gözləyir</p>
                  )}
                </div>
              </div>

              <Suspense>
                <UsersFilterBar groups={allGroups} />
              </Suspense>

              <div className="card overflow-hidden mt-3">
                {filteredStudents.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    {students.length === 0 ? "Hələ heç bir tələbə yoxdur" : "Filter nəticəsi tapılmadı"}
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
                        {filteredStudents.map((student) => (
                          <UserRow key={student.id} student={student} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
