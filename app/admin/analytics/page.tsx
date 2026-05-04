import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, activityLogs } from "@/lib/schema";
import { desc, gte, count, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { canViewAnalytics } from "@/lib/rbac";

export const revalidate = 0;

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session || !canViewAnalytics(session.user.role)) redirect("/admin");

  // --- Online Users (last 5 min) ---
  let onlineUsers: Array<{ id: string; name: string | null; email: string; groupName: string | null; lastSeenAt: Date | null }> = [];
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    onlineUsers = await db
      .select({ id: users.id, name: users.name, email: users.email, groupName: users.groupName, lastSeenAt: users.lastSeenAt })
      .from(users)
      .where(gte(users.lastSeenAt, fiveMinAgo))
      .orderBy(desc(users.lastSeenAt));
  } catch { /* column may not exist yet */ }

  // --- User Breakdown ---
  let totalStudents = 0, totalStaff = 0, totalTeachers = 0;
  let studentsVerified = 0, studentsBlocked = 0;
  try {
    const allUsers = await db.select({ role: users.role, emailVerified: users.emailVerified, isBlocked: users.isBlocked })
      .from(users).where(isNull(users.deletedAt));
    totalStudents = allUsers.filter((u) => u.role === "student").length;
    totalStaff    = allUsers.filter((u) => u.role !== "student" && u.role !== "teacher").length;
    totalTeachers = allUsers.filter((u) => u.role === "teacher").length;
    studentsVerified = allUsers.filter((u) => u.role === "student" && u.emailVerified).length;
    studentsBlocked  = allUsers.filter((u) => u.role === "student" && u.isBlocked).length;
  } catch { /* ignore */ }

  // --- Teacher activity (last 30 days) ---
  let teacherActivity: Array<{ actorEmail: string | null; actions: number }> = [];
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = await db.select({ actorEmail: activityLogs.actorEmail, count: count() })
      .from(activityLogs)
      .where(gte(activityLogs.createdAt, thirtyDaysAgo))
      .groupBy(activityLogs.actorEmail)
      .orderBy(desc(count()));
    teacherActivity = rows.map((r) => ({ actorEmail: r.actorEmail, actions: Number(r.count) })).slice(0, 10);
  } catch { /* ignore */ }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      {/* Online Users */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Online İstifadəçilər
          <span className="ml-2 text-sm font-normal text-gray-500">(son 5 dəqiqə)</span>
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            {onlineUsers.length} aktiv
          </span>
        </h2>
        <div className="card">
          {onlineUsers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Hazırda aktiv istifadəçi yoxdur</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-3 py-3 text-gray-500 font-medium">Ad Soyad</th>
                    <th className="text-left px-3 py-3 text-gray-500 font-medium">Qrup</th>
                    <th className="text-left px-3 py-3 text-gray-500 font-medium">Son aktivlik</th>
                  </tr>
                </thead>
                <tbody>
                  {onlineUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></span>
                          <span className="font-medium text-gray-900">{u.name ?? "–"}</span>
                          <span className="text-gray-400 text-xs">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-500">{u.groupName ?? "–"}</td>
                      <td className="px-3 py-3 text-gray-500">
                        {u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleTimeString("az-AZ") : "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* User Breakdown */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">İstifadəçi Statistikası</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="card text-center py-4">
            <div className="text-3xl font-bold text-blue-600">{totalStudents}</div>
            <div className="text-sm text-gray-500 mt-1">Tələbə</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-3xl font-bold text-green-600">{studentsVerified}</div>
            <div className="text-sm text-gray-500 mt-1">Təsdiqlənmiş</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-3xl font-bold text-amber-600">{totalStudents - studentsVerified}</div>
            <div className="text-sm text-gray-500 mt-1">Gözləyir</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-3xl font-bold text-purple-600">{totalTeachers}</div>
            <div className="text-sm text-gray-500 mt-1">Müəllim</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-3xl font-bold text-gray-600">{totalStaff}</div>
            <div className="text-sm text-gray-500 mt-1">Digər işçi</div>
          </div>
        </div>
      </section>

      {/* Top Active Users (last 30 days) */}
      {teacherActivity.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Aktiv İstifadəçilər
            <span className="ml-2 text-sm font-normal text-gray-400">(son 30 gün, fəaliyyət jurnalına görə)</span>
          </h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">E-poçt</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Əməliyyat sayı</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherActivity.map((row, i) => (
                    <tr key={row.actorEmail ?? i} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 text-gray-700">{row.actorEmail ?? "–"}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {row.actions}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
