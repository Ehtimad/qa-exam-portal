import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages } from "@/lib/schema";
import { and, eq, count } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ count: 0 });

  const [result] = await db
    .select({ count: count() })
    .from(messages)
    .where(and(eq(messages.receiverId, session.user.id), eq(messages.isRead, false)));

  return NextResponse.json({ count: Number(result?.count ?? 0) });
}
