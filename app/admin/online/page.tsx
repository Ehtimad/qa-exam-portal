import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { gte, desc, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { canViewAnalytics } from "@/lib/rbac";

export const revalidate = 0;

export default async function OnlineUsersPage() {
  const session = await auth();
  if (!session || !canViewAnalytics(session.user.role)) redirect("/admin");

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  let onlineUsers: Array<{
    id: string; name: string | null; email: string;
    groupName: string | null; role: string; lastSeenAt: Date | null;
  }> = [];

  try {
    onlineUsers = await db
      .select({ id: users.id, name: users.name, email: users.email, groupName: users.groupName, role: users.role, lastSeenAt: users.lastSeenAt })
      .from(users)
      .where(gte(users.lastSeenAt, fiveMinAgo))
      .orderBy(desc(users.lastSeenAt));
  } catch { /* column may not exist yet */ }

  const students    = onlineUsers.filter((u) => u.role === "student");
  const staffOnline = onlineUsers.filter((u) => u.role !== "student");

  function secsAgo(d: Date | null) {
    if (!d) return "–";
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return `${s}s əvvəl`;
    return `${Math.floor(s / 60)}d əvvəl`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-6 flex-wrap">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">← Admin</Link>
          <span className="font-semibold text-gray-900">Online İstifadəçilər</span>
          <Link href="/admin/users"     className="text-sm text-gray-500 hover:text-gray-900">İstifadəçilər</Link>
          <Link href="/admin/analytics" className="text-sm text-gray-500 hover:text-gray-900">Analitika</Link>
          <Link href="/admin/activity"  className="text-sm text-gray-500 hover:text-gray-900">Fəaliyyət</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Online İstifadəçilər</h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
            {onlineUsers.length} aktiv
          </span>
          <span className="text-sm text-gray-400">(son 5 dəqiqə)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="card text-center py-4">
            <div className="text-3xl font-bold text-green-600">{onlineUsers.length}</div>
            <div className="text-sm text-gray-500 mt-1">Cəmi online</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-3xl font-bold text-blue-600">{students.length}</div>
            <div className="text-sm text-gray-500 mt-1">Tələbə</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-3xl font-bold text-purple-600">{staffOnline.length}</div>
            <div className="text-sm text-gray-500 mt-1">İşçi</div>
          </div>
        </div>

        {onlineUsers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">Hazırda aktiv istifadəçi yoxdur</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Ad Soyad</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Rol / Qrup</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">E-poçt</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Son aktivlik</th>
                  </tr>
                </thead>
                <tbody>
                  {onlineUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
                          <span className="font-medium text-gray-900">{u.name ?? "–"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {u.role === "student"
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">{u.groupName ?? "Qrupsuz"}</span>
                          : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">{u.role}</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{secsAgo(u.lastSeenAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
