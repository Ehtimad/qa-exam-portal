import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { activityLogs } from "@/lib/schema";
import { desc, like, and, gte, lte } from "drizzle-orm";
import { canManageUsers } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action  = searchParams.get("action") ?? "";
  const actor   = searchParams.get("actor") ?? "";
  const from    = searchParams.get("from") ?? "";
  const to      = searchParams.get("to") ?? "";
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit   = 50;
  const offset  = (page - 1) * limit;

  const conditions = [];
  if (action) conditions.push(like(activityLogs.action, `%${action}%`));
  if (actor)  conditions.push(like(activityLogs.actorEmail, `%${actor}%`));
  if (from)   conditions.push(gte(activityLogs.createdAt, new Date(from)));
  if (to)     conditions.push(lte(activityLogs.createdAt, new Date(to)));

  const rows = await db
    .select()
    .from(activityLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ logs: rows, page, limit });
}
