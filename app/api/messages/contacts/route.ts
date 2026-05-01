import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages, users } from "@/lib/schema";
import { isNull, or, eq, and, ne, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/messages/contacts — all users current user can chat with + unread counts
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;

  const allUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, image: users.image })
    .from(users)
    .where(and(ne(users.id, uid), isNull(users.deletedAt)));

  const unreadRows = await db
    .select({ senderId: messages.senderId, cnt: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(eq(messages.receiverId, uid), eq(messages.isRead, false)))
    .groupBy(messages.senderId);

  const unreadMap = Object.fromEntries(unreadRows.map((r) => [r.senderId, r.cnt]));

  return NextResponse.json(
    allUsers.map((u) => ({ ...u, unread: unreadMap[u.id] ?? 0 }))
  );
}
