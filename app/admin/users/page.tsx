import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, groups } from "@/lib/schema";
import { asc, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { UserRow, CreateUserModal } from "./UserActions";
import { Suspense } from "react";
import UsersFilterBar from "./UsersFilterBar";
import { canManageUsers } from "@/lib/rbac";
import CreateUserButton from "./CreateUserButton";
import PerPageSelect from "@/components/PerPageSelect";

type DBUser = typeof users.$inferSelect;
type Group = typeof groups.$inferSelect;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string; status?: string; role?: string; page?: string; perPage?: string }>;
}) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/admin");

  const { q = "", group = "", status = "", role: roleFilter = "", page: pageStr = "1", perPage: perPageStr = "25" } = await searchParams;
  const page    = Math.max(1, parseInt(pageStr, 10));
  const perPage = [10, 25, 50, 100].includes(Number(perPageStr)) ? Number(perPageStr) : 25;

  let allUsers: DBUser[] = [];
  let allGroups: Group[] = [];
  let dbError = false;

  try {
    allUsers = await db.select().from(users).where(isNull(users.deletedAt)).orderBy(asc(users.createdAt));
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

  const filteredStudents   = filterList(students);
  const filteredStaff      = filterList(staffUsers);
  const pendingCount       = students.filter((s) => !s.emailVerified).length;
  const totalStudentPages  = Math.ceil(filteredStudents.length / perPage);
  const paginatedStudents  = filteredStudents.slice((page - 1) * perPage, page * perPage);

  return (
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
              <CreateUserButton />
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

            <div className="flex items-center justify-between">
              <Suspense>
                <UsersFilterBar groups={allGroups} />
              </Suspense>
              <Suspense>
                <PerPageSelect value={perPage} />
              </Suspense>
            </div>

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
                      {paginatedStudents.map((student) => (
                        <UserRow key={student.id} student={student} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {totalStudentPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-4">
                {page > 1 && (
                  <a
                    href={`?q=${q}&group=${group}&status=${status}&role=${roleFilter}&page=${page - 1}&perPage=${perPage}`}
                    className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50"
                  >
                    ← Əvvəlki
                  </a>
                )}
                {Array.from({ length: totalStudentPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalStudentPages || Math.abs(p - page) <= 2)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-gray-400">…</span>
                    ) : (
                      <a
                        key={p}
                        href={`?q=${q}&group=${group}&status=${status}&role=${roleFilter}&page=${p}&perPage=${perPage}`}
                        className={`px-3 py-1.5 text-sm rounded border ${
                          p === page
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </a>
                    )
                  )}
                {page < totalStudentPages && (
                  <a
                    href={`?q=${q}&group=${group}&status=${status}&role=${roleFilter}&page=${page + 1}&perPage=${perPage}`}
                    className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50"
                  >
                    Növbəti →
                  </a>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
