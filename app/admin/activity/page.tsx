import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { activityLogs } from "@/lib/schema";
import { desc, like, and, gte, lte } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { canManageUsers } from "@/lib/rbac";

export const revalidate = 0;

const ACTION_LABELS: Record<string, string> = {
  "user.create":        "İstifadəçi yaradıldı",
  "user.update":        "İstifadəçi yeniləndi",
  "user.delete":        "İstifadəçi silindi",
  "user.block":         "İstifadəçi bloklandı",
  "user.unblock":       "Blok açıldı",
  "user.verify":        "Hesab təsdiqləndi",
  "user.unverify":      "Təsdiq ləğv edildi",
  "exam.start":         "İmtahan başladı",
  "exam.submit":        "İmtahan təqdim edildi",
  "material.upload":    "Material yükləndi",
  "material.delete":    "Material silindi",
  "notification.send":  "Bildiriş göndərildi",
  "impersonation.start":"İstifadəçi kimi giriş",
};

function actionColor(action: string) {
  if (action.includes("delete") || action.includes("block")) return "bg-red-100 text-red-700";
  if (action.includes("create") || action.includes("upload") || action.includes("verify")) return "bg-green-100 text-green-700";
  if (action.includes("unblock") || action.includes("unverify")) return "bg-amber-100 text-amber-700";
  if (action.includes("exam")) return "bg-blue-100 text-blue-700";
  if (action.includes("impersonation")) return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-600";
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; actor?: string; from?: string; to?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/admin");

  const { action = "", actor = "", from = "", to = "", page: pageStr = "1" } = await searchParams;
  const page   = Math.max(1, parseInt(pageStr, 10));
  const limit  = 50;
  const offset = (page - 1) * limit;

  let logs: typeof activityLogs.$inferSelect[] = [];
  let dbError = false;

  try {
    const conditions = [];
    if (action) conditions.push(like(activityLogs.action, `%${action}%`));
    if (actor)  conditions.push(like(activityLogs.actorEmail, `%${actor}%`));
    if (from)   conditions.push(gte(activityLogs.createdAt, new Date(from)));
    if (to)     conditions.push(lte(activityLogs.createdAt, new Date(to)));

    logs = await db
      .select()
      .from(activityLogs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);
  } catch {
    dbError = true;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fəaliyyət Jurnalı</h1>
      </div>

      {/* Filters */}
      <form method="GET" className="card p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Əməliyyat</label>
          <select name="action" defaultValue={action}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Hamısı</option>
            {Object.keys(ACTION_LABELS).map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Aktor (e-poçt)</label>
          <input type="text" name="actor" defaultValue={actor} placeholder="admin@..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Başlanğıc</label>
          <input type="date" name="from" defaultValue={from}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Son</label>
          <input type="date" name="to" defaultValue={to}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" className="btn-primary text-sm">Filtrele</button>
        <Link href="/admin/activity" className="btn-secondary text-sm">Sıfırla</Link>
      </form>

      {dbError ? (
        <div className="card text-center py-10">
          <p className="text-amber-700">Fəaliyyət cədvəli hazırlanır. Bir az sonra yenidən cəhd edin.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">Fəaliyyət tapılmadı</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Vaxt</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Əməliyyat</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Aktor</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Hədəf</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Təfsilatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    let details: Record<string, unknown> = {};
                    try { details = log.details ? JSON.parse(log.details) : {}; } catch { /**/ }
                    return (
                      <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("az-AZ")}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColor(log.action)}`}>
                            {ACTION_LABELS[log.action] ?? log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{log.actorEmail ?? "–"}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {log.targetType && <span className="text-xs text-gray-400 mr-1">{log.targetType}</span>}
                          {log.targetId ? <span className="font-mono text-xs">{log.targetId.slice(0, 8)}…</span> : "–"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs">
                          {Object.keys(details).length > 0 ? (
                            <span className="text-xs text-gray-400 font-mono truncate block" title={JSON.stringify(details)}>
                              {Object.entries(details).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                            </span>
                          ) : "–"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {logs.length === limit && (
        <div className="flex justify-end mt-4 gap-2">
          {page > 1 && (
            <Link href={`/admin/activity?action=${action}&actor=${actor}&from=${from}&to=${to}&page=${page - 1}`}
              className="btn-secondary text-sm">← Əvvəlki</Link>
          )}
          <Link href={`/admin/activity?action=${action}&actor=${actor}&from=${from}&to=${to}&page=${page + 1}`}
            className="btn-primary text-sm">Növbəti →</Link>
        </div>
      )}
    </div>
  );
}
