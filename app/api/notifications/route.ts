import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications, notificationReads } from "@/lib/schema";
import { and, eq, isNull, or, desc, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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

  if (rows.length === 0) return NextResponse.json([]);

  const notifIds = rows.map((r) => r.id);
  const readReceipts = await db
    .select({ notificationId: notificationReads.notificationId })
    .from(notificationReads)
    .where(and(eq(notificationReads.userId, uid), inArray(notificationReads.notificationId, notifIds)));

  const readSet = new Set(readReceipts.map((r) => r.notificationId));

  const result = rows.map((n) => ({
    ...n,
    isRead: n.type === "individual" ? (n.isRead || readSet.has(n.id)) : readSet.has(n.id),
  }));

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.insert(notificationReads).values({ notificationId: id, userId: uid }).onConflictDoNothing();

  await db.update(notifications).set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, uid)));

  return NextResponse.json({ ok: true });
}
