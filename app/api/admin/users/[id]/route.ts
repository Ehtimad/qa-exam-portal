import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, groups, examSessions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManageUsers } from "@/lib/rbac";

const VALID_ROLES = ["student", "admin", "manager", "reporter", "worker", "teacher"] as const;

const updateSchema = z.object({
  name:        z.string().min(2).max(100),
  groupId:     z.string().nullable().optional(),
  email:       z.string().email(),
  role:        z.enum(VALID_ROLES).optional(),
  newPassword: z.string().min(6).max(100).optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) return null;
  return session;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Məlumatlar düzgün deyil" }, { status: 400 });

  const { name, groupId, email, role, newPassword } = parsed.data;

  const [existing] = await db.select({ id: users.id, groupId: users.groupId }).from(users).where(eq(users.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });

  let groupName: string | null = null;
  if (groupId) {
    const [group] = await db.select({ name: groups.name }).from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) return NextResponse.json({ error: "Qrup tapılmadı" }, { status: 400 });
    groupName = group.name;
  }

  const updates: Record<string, unknown> = {
    name,
    email,
    groupId: groupId ?? null,
    groupName,
  };
  if (role) updates.role = role;
  if (newPassword) {
    updates.password = await bcrypt.hash(newPassword, 12);
  }

  await db.update(users).set(updates).where(eq(users.id, id));

  // If group changed, clear any in-progress exam session so user gets fresh questions
  if (existing.groupId !== (groupId ?? null)) {
    await db.delete(examSessions).where(
      and(eq(examSessions.userId, id), eq(examSessions.status, "in_progress"))
    );
  }

  revalidatePath("/admin/users");
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  let reason: string | null = null;
  try {
    const body = await req.json();
    reason = body.reason ?? null;
  } catch { /* no body */ }

  if (!reason?.trim()) {
    return NextResponse.json({ error: "Silmə səbəbi tələb olunur" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ deletedAt: new Date(), deletionReason: reason.trim() })
    .where(eq(users.id, id));

  revalidatePath("/admin/users");
  return NextResponse.json({ success: true });
}
