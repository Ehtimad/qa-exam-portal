import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, users } from "@/lib/schema";
import { asc, eq, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import GroupsClient from "./GroupsClient";
import { canManageGroups } from "@/lib/rbac";

export default async function AdminGroupsPage() {
  const session = await auth();
  if (!session || !canManageGroups(session.user.role)) redirect("/admin");

  const allGroups = await db.select().from(groups).orderBy(asc(groups.name));

  // Count students per group
  const studentCounts = await db
    .select({ groupId: users.groupId, count: count() })
    .from(users)
    .where(eq(users.role, "student"))
    .groupBy(users.groupId);

  const countMap: Record<string, number> = {};
  for (const r of studentCounts) {
    if (r.groupId) countMap[r.groupId] = r.count;
  }

  const groupsWithCount = allGroups.map((g) => ({
    ...g,
    studentCount: countMap[g.id] ?? 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-6 flex-wrap">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">← Admin</Link>
          <span className="font-semibold text-gray-900">Qruplar</span>
          <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-900">İstifadəçilər</Link>
          <Link href="/admin/results" className="text-sm text-gray-500 hover:text-gray-900">Nəticələr</Link>
          <Link href="/admin/questions" className="text-sm text-gray-500 hover:text-gray-900">Suallar</Link>
          <Link href="/admin/exams" className="text-sm text-gray-500 hover:text-gray-900">İmtahanlar</Link>
          <Link href="/admin/analytics" className="text-sm text-gray-500 hover:text-gray-900">Analitika</Link>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <GroupsClient initialGroups={groupsWithCount} />
      </div>
    </div>
  );
}
