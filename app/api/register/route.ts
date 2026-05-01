import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, groups } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name:      z.string().min(2).max(100),
  email:     z.string().email(),
  password:  z.string().min(6).max(100),
  groupId:   z.string().min(1),
  isStudent: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Məlumatlar düzgün deyil" }, { status: 400 });
  }

  const { name, email, password, groupId, isStudent } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Bu e-poçt artıq qeydiyyatdadır" }, { status: 409 });
  }

  const [group] = await db
    .select({ id: groups.id, name: groups.name })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!group) {
    return NextResponse.json({ error: "Qrup tapılmadı" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  // Students require email verification (pending approval); non-students are auto-verified
  const emailVerified = isStudent ? null : new Date();

  await db.insert(users).values({
    name,
    email,
    password: hashed,
    role: "student",
    groupId: group.id,
    groupName: group.name,
    isStudent,
    emailVerified,
  });

  return NextResponse.json({ success: true, requiresApproval: isStudent }, { status: 201 });
}
