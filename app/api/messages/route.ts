import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages, users } from "@/lib/schema";
import { pusher } from "@/lib/pusher";
import { eq, or, and, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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
