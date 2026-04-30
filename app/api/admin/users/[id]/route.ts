import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, groups, examSessions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(100),
  groupId: z.string().min(1),
  email: z.string().email(),
  newPassword: z.string().min(6).max(100).optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Məlumatlar düzgün deyil" }, { status: 400 });

  const { name, groupId, email, newPassword } = parsed.data;

  const [existing] = await db.select({ id: users.id, groupId: users.groupId }).from(users).where(eq(users.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });

  const [group] = await db.select({ name: groups.name }).from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group) return NextResponse.json({ error: "Qrup tapılmadı" }, { status: 400 });

  const updates: Record<string, unknown> = { name, email, groupId, groupName: group.name };
  if (newPassword) {
    updates.password = await bcrypt.hash(newPassword, 12);
  }

  await db.update(users).set(updates).where(eq(users.id, id));

  // If group changed, clear any in-progress exam session so user gets fresh questions for new group
  if (existing.groupId !== groupId) {
    await db.delete(examSessions).where(
      and(eq(examSessions.userId, id), eq(examSessions.status, "in_progress"))
    );
  }

  revalidatePath("/admin/users");
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/users");
  return NextResponse.json({ success: true });
}
