import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, groups, examSessions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManageUsers } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

const VALID_ROLES = ["student", "admin", "manager", "reporter", "worker", "teacher"] as const;

const updateSchema = z.object({
  name:        z.string().min(2).max(100),
  groupId:     z.string().nullable().optional(),
  email:       z.string().email(),
  role:        z.enum(VALID_ROLES).optional(),
  newPassword: z.string().min(6).max(100).optional(),
});

async function requireUserEditor() {
  const session = await auth();
  if (!session) return null;
  if (canManageUsers(session.user.role) || session.user.role === "teacher") return session;
  return null;
}

async function getTargetAndCheckOwnership(targetId: string, session: { user: { id: string; role: string } }) {
  const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) return { target: null, forbidden: false };
  if (session.user.role === "teacher" && target.teacherId !== session.user.id) {
    return { target: null, forbidden: true };
  }
  return { target, forbidden: false };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUserEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { target, forbidden } = await getTargetAndCheckOwnership(id, session);
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!target) return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Məlumatlar düzgün deyil" }, { status: 400 });

  const { name, groupId, email, role, newPassword } = parsed.data;

  let groupName: string | null = null;
  if (groupId) {
    const [group] = await db.select({ name: groups.name }).from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) return NextResponse.json({ error: "Qrup tapılmadı" }, { status: 400 });
    groupName = group.name;
  }

  const updates: Record<string, unknown> = { name, email, groupId: groupId ?? null, groupName };
  // Teachers cannot change a student's role
  if (role && session.user.role !== "teacher") updates.role = role;
  if (newPassword) updates.password = await bcrypt.hash(newPassword, 12);

  await db.update(users).set(updates).where(eq(users.id, id));

  if (target.groupId !== (groupId ?? null)) {
    await db.delete(examSessions).where(and(eq(examSessions.userId, id), eq(examSessions.status, "in_progress")));
  }

  await logActivity({ actorId: session.user.id, actorEmail: session.user.email, action: "user.update", targetType: "user", targetId: id, details: { name, email, role } });

  revalidatePath("/admin/users");
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUserEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { target, forbidden } = await getTargetAndCheckOwnership(id, session);
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!target) return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });

  let reason: string | null = null;
  try {
    const body = await req.json();
    reason = body.reason ?? null;
  } catch { /* no body */ }

  if (!reason?.trim()) {
    return NextResponse.json({ error: "Silmə səbəbi tələb olunur" }, { status: 400 });
  }

  await db.update(users).set({ deletedAt: new Date(), deletionReason: reason.trim() }).where(eq(users.id, id));

  await logActivity({ actorId: session.user.id, actorEmail: session.user.email, action: "user.delete", targetType: "user", targetId: id, details: { reason, targetEmail: target.email } });

  revalidatePath("/admin/users");
  return NextResponse.json({ success: true });
}
