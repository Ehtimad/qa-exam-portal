import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, groups } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ALLOWED_REGISTER_ROLES = ["student", "teacher"] as const;

const schema = z.object({
  name:      z.string().min(2).max(100),
  email:     z.string().email(),
  password:  z.string().min(6).max(100),
  groupId:   z.string().nullable().optional(),
  teacherId: z.string().nullable().optional(),
  isStudent: z.boolean().optional().default(true),
  role:      z.enum(ALLOWED_REGISTER_ROLES).optional().default("student"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Məlumatlar düzgün deyil" }, { status: 400 });
  }

  const { name, email, password, groupId, teacherId, isStudent, role } = parsed.data;

  if (role === "student" && isStudent && !teacherId) {
    return NextResponse.json({ error: "Tələbə üçün müəllim seçimi məcburidir" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Bu e-poçt artıq qeydiyyatdadır" }, { status: 409 });
  }

  let groupName: string | null = null;
  if (groupId) {
    const [group] = await db
      .select({ id: groups.id, name: groups.name })
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);
    if (!group) return NextResponse.json({ error: "Qrup tapılmadı" }, { status: 400 });
    groupName = group.name;
  } else if (role !== "teacher") {
    return NextResponse.json({ error: "Qrup seçin" }, { status: 400 });
  }

  // Validate teacher exists if provided
  if (teacherId) {
    const [teacher] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, teacherId))
      .limit(1);
    if (!teacher) {
      return NextResponse.json({ error: "Seçilən müəllim tapılmadı" }, { status: 400 });
    }
  }

  const hashed = await bcrypt.hash(password, 12);

  // Students and teachers require approval; "other" is auto-verified
  const requiresApproval = role === "student" || role === "teacher";
  const emailVerified = requiresApproval ? null : new Date();

  await db.insert(users).values({
    name,
    email,
    password: hashed,
    role,
    groupId: groupId ?? null,
    groupName,
    teacherId: teacherId ?? null,
    isStudent: role === "student" ? isStudent : false,
    emailVerified,
  });

  return NextResponse.json({ success: true, requiresApproval }, { status: 201 });
}
