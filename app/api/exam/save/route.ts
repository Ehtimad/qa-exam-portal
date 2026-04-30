import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examSessions } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  answers: z.record(z.string(), z.array(z.number())),
  tabSwitches: z.number().int().min(0).optional(),
  elapsedSeconds: z.number().int().min(0).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Yanlış format" }, { status: 400 });

  const [existing] = await db
    .select({ id: examSessions.id })
    .from(examSessions)
    .where(and(eq(examSessions.userId, session.user.id), eq(examSessions.status, "in_progress")))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Aktiv sessiya tapılmadı" }, { status: 404 });

  const updates: Record<string, unknown> = {
    answers: JSON.stringify(parsed.data.answers),
    lastActiveAt: new Date(),
  };
  if (parsed.data.tabSwitches !== undefined) {
    updates.tabSwitches = parsed.data.tabSwitches;
  }
  if (parsed.data.elapsedSeconds !== undefined) {
    updates.elapsedSeconds = parsed.data.elapsedSeconds;
  }

  await db.update(examSessions).set(updates).where(eq(examSessions.id, existing.id));
  return NextResponse.json({ success: true });
}
