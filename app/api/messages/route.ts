import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages, users } from "@/lib/schema";
import { pusher } from "@/lib/pusher";
import { eq, or, and, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_ROLES = ["admin", "manager"];

// GET /api/messages?with=<userId>  — conversation
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const otherId = req.nextUrl.searchParams.get("with");
  if (!otherId) return NextResponse.json({ error: "Missing 'with' param" }, { status: 400 });

  const rows = await db
    .select()
    .from(messages)
    .where(
      or(
        and(eq(messages.senderId, session.user.id), eq(messages.receiverId, otherId)),
        and(eq(messages.senderId, otherId), eq(messages.receiverId, session.user.id))
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(100);

  // Mark incoming as read
  await db
    .update(messages)
    .set({ isRead: true })
    .where(and(eq(messages.senderId, otherId), eq(messages.receiverId, session.user.id)));

  return NextResponse.json(rows.reverse());
}

// POST /api/messages  — send
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, content } = await req.json();
  if (!receiverId || !content?.trim()) {
    return NextResponse.json({ error: "receiverId and content required" }, { status: 400 });
  }

  const [msg] = await db
    .insert(messages)
    .values({
      senderId: session.user.id,
      receiverId,
      content: content.trim(),
    })
    .returning();

  // Real-time push to receiver's private channel
  await pusher.trigger(`private-user-${receiverId}`, "new-message", {
    ...msg,
    senderName: session.user.name,
  });

  return NextResponse.json(msg);
}

// PATCH /api/messages — edit message content (sender or admin)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, content } = await req.json();
  if (!id || !content?.trim()) return NextResponse.json({ error: "id and content required" }, { status: 400 });

  const [msg] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = ADMIN_ROLES.includes(session.user.role);
  if (msg.senderId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [updated] = await db.update(messages).set({ content: content.trim() })
    .where(eq(messages.id, id)).returning();

  await pusher.trigger(`private-user-${updated.receiverId}`, "message-updated", updated);
  await pusher.trigger(`private-user-${updated.senderId}`, "message-updated", updated);

  return NextResponse.json(updated);
}

// DELETE /api/messages — delete a message (sender or admin)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const [msg] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = ADMIN_ROLES.includes(session.user.role);
  if (msg.senderId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(messages).where(eq(messages.id, id));

  await pusher.trigger(`private-user-${msg.receiverId}`, "message-deleted", { id });
  await pusher.trigger(`private-user-${msg.senderId}`, "message-deleted", { id });

  return NextResponse.json({ success: true });
}
