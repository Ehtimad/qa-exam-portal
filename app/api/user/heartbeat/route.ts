import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, session.user.id));
  return NextResponse.json({ ok: true });
}
