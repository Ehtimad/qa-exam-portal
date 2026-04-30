import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, groups, examSessions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  groupId: z.string().min(1),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).max(100).optional(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Məlumatlar düzgün deyil" }, { status: 400 });

  const { name, groupId, currentPassword, newPassword } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });

  const [group] = await db.select({ name: groups.name }).from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group) return NextResponse.json({ error: "Qrup tapılmadı" }, { status: 400 });

  const updates: Record<string, unknown> = { name, groupId, groupName: group.name };

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Cari şifrəni daxil edin" }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.password ?? "");
    if (!valid) {
      return NextResponse.json({ error: "Cari şifrə yanlışdır" }, { status: 400 });
    }
    updates.password = await bcrypt.hash(newPassword, 12);
  }

  await db.update(users).set(updates).where(eq(users.id, session.user.id));

  // Clear in-progress exam session so user gets fresh questions for new group
  if (user.groupId !== groupId) {
    await db.delete(examSessions).where(
      and(eq(examSessions.userId, session.user.id), eq(examSessions.status, "in_progress"))
    );
  }

  return NextResponse.json({ success: true });
}
