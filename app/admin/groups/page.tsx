import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, users } from "@/lib/schema";
import { asc, eq, count } from "drizzle-orm";
import { redirect } from "next/navigation";
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <GroupsClient initialGroups={groupsWithCount} />
    </div>
  );
}
