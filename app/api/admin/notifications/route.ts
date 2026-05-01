import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/schema";
import { canSendNotifications } from "@/lib/rbac";
import { pusher } from "@/lib/pusher";
import { eq, isNull, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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

  if (type === "individual" && userId) {
    const [row] = await db.insert(notifications).values({ title, message, type, userId }).returning();
    await pusher.trigger(`private-user-${userId}`, "notification", row);
    return NextResponse.json(row);
  }

  if (type === "group" && groupId) {
    const [row] = await db.insert(notifications).values({ title, message, type, groupId }).returning();
    await pusher.trigger(`group-${groupId}`, "notification", row);
    return NextResponse.json(row);
  }

  if (type === "all") {
    const [row] = await db.insert(notifications).values({ title, message, type }).returning();
    await pusher.trigger("notifications", "broadcast", row);
    return NextResponse.json(row);
  }

  return NextResponse.json({ error: "Invalid type/target combination" }, { status: 400 });
}
