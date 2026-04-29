import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examSessions } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [existing] = await db
    .select({ id: examSessions.id, answers: examSessions.answers })
    .from(examSessions)
    .where(and(eq(examSessions.userId, session.user.id), eq(examSessions.status, "in_progress")))
    .limit(1);

  if (!existing) return NextResponse.json({ success: true });

  const answers = JSON.parse(existing.answers) as Record<string, number[]>;
  const hasAnswers = Object.values(answers).some((a) => a.length > 0);

  if (hasAnswers) {
    // Keep session as abandoned (can be resumed if admin resets attempt)
    await db.update(examSessions).set({ status: "abandoned" }).where(eq(examSessions.id, existing.id));
  } else {
    // 0 answers: delete session, no trace
    await db.delete(examSessions).where(eq(examSessions.id, existing.id));
  }

  return NextResponse.json({ success: true });
}
