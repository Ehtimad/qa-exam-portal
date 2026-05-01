import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, groups } from "@/lib/schema";
import { eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { canManageUsers } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import bcrypt from "bcryptjs";
import { z } from "zod";

const VALID_ROLES = ["student", "admin", "manager", "reporter", "worker", "teacher"] as const;

const createSchema = z.object({
  name:      z.string().min(2).max(100),
  email:     z.string().email(),
  password:  z.string().min(6).max(100),
  role:      z.enum(VALID_ROLES).default("student"),
  groupId:   z.string().nullable().optional(),
  isStudent: z.boolean().optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allUsers = await db
    .select({
      id:            users.id,
      name:          users.name,
      email:         users.email,
      role:          users.role,
      groupName:     users.groupName,
      groupId:       users.groupId,
      emailVerified: users.emailVerified,
      isBlocked:     users.isBlocked,
      isStudent:     users.isStudent,
      lastSeenAt:    users.lastSeenAt,
      createdAt:     users.createdAt,
    })
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(users.createdAt);

  return NextResponse.json({ users: allUsers });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Məlumatlar düzgün deyil" }, { status: 400 });

  const { name, email, password, role, groupId, isStudent } = parsed.data;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return NextResponse.json({ error: "Bu e-poçt artıq mövcuddur" }, { status: 409 });

  let groupName: string | null = null;
  if (groupId) {
    const [group] = await db.select({ name: groups.name }).from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) return NextResponse.json({ error: "Qrup tapılmadı" }, { status: 400 });
    groupName = group.name;
  }

  const hash = await bcrypt.hash(password, 12);
  const isStaff = role !== "student";
  // Staff accounts and admin-created students are auto-verified
  const emailVerified = new Date();
  const studentFlag = isStudent !== undefined ? isStudent : !isStaff;

  const [newUser] = await db.insert(users).values({
    name,
    email,
    password:      hash,
    role,
    groupId:       groupId ?? null,
    groupName,
    isStudent:     studentFlag,
    emailVerified,
  }).returning({ id: users.id, email: users.email });

  await logActivity({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    action:     "user.create",
    targetType: "user",
    targetId:   newUser.id,
    details:    { name, email, role },
  });

  revalidatePath("/admin/users");
  return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, action } = await req.json();
  if (!userId || !action) return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });

  const [target] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });

  switch (action) {
    case "verify":
      await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, userId));
      await logActivity({ actorId: session.user.id, actorEmail: session.user.email, action: "user.verify", targetType: "user", targetId: userId, details: { targetEmail: target.email } });
      break;
    case "unverify":
      await db.update(users).set({ emailVerified: null }).where(eq(users.id, userId));
      await logActivity({ actorId: session.user.id, actorEmail: session.user.email, action: "user.unverify", targetType: "user", targetId: userId, details: { targetEmail: target.email } });
      break;
    case "block":
      await db.update(users).set({ isBlocked: true }).where(eq(users.id, userId));
      await logActivity({ actorId: session.user.id, actorEmail: session.user.email, action: "user.block", targetType: "user", targetId: userId, details: { targetEmail: target.email } });
      break;
    case "unblock":
      await db.update(users).set({ isBlocked: false }).where(eq(users.id, userId));
      await logActivity({ actorId: session.user.id, actorEmail: session.user.email, action: "user.unblock", targetType: "user", targetId: userId, details: { targetEmail: target.email } });
      break;
    default:
      return NextResponse.json({ error: "Yanlış əməliyyat" }, { status: 400 });
  }

  revalidatePath("/admin/users");
  return NextResponse.json({ success: true });
}
