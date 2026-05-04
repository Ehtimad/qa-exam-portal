import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { canSendNotifications } from "@/lib/rbac";
import { pusher } from "@/lib/pusher";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canSendNotifications(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(100);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !canSendNotifications(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, message, type, userId, groupId } = await req.json();
  if (!title || !message || !type) {
    return NextResponse.json({ error: "title, message, type required" }, { status: 400 });
  }

  let row: typeof notifications.$inferSelect;

  if (type === "individual" && userId) {
    [row] = await db.insert(notifications).values({ title, message, type, userId }).returning();
    await pusher.trigger(`private-user-${userId}`, "notification", row);
  } else if (type === "group" && groupId) {
    [row] = await db.insert(notifications).values({ title, message, type, groupId }).returning();
    await pusher.trigger(`group-${groupId}`, "notification", row);
  } else if (type === "all") {
    [row] = await db.insert(notifications).values({ title, message, type }).returning();
    await pusher.trigger("notifications", "broadcast", row);
  } else {
    return NextResponse.json({ error: "Invalid type/target combination" }, { status: 400 });
  }

  await logActivity({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    action:     "notification.send",
    targetType: "notification",
    targetId:   row.id,
    details:    { type, title },
  });

  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !canSendNotifications(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const [deleted] = await db.delete(notifications).where(eq(notifications.id, id)).returning();

  if (deleted) {
    await pusher.trigger("notifications", "notification-deleted", { id });
    if (deleted.userId) {
      await pusher.trigger(`private-user-${deleted.userId}`, "notification-deleted", { id });
    }
  }

  return NextResponse.json({ success: true });
}
