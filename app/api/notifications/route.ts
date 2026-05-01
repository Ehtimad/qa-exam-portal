import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { and, eq, isNull, or, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/notifications — notifications for current user
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const groupId = session.user.groupId ?? null;

  const rows = await db
    .select()
    .from(notifications)
    .where(
      or(
        eq(notifications.userId, uid),
        and(eq(notifications.type, "group"), groupId ? eq(notifications.groupId, groupId) : isNull(notifications.groupId)),
        eq(notifications.type, "all")
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return NextResponse.json(rows);
}

// PATCH /api/notifications/:id/read  — mark as read (handled inline for convenience)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
