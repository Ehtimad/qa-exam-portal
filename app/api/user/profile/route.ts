import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  groupName: z.string().min(1).max(100),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).max(100).optional(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Məlumatlar düzgün deyil" }, { status: 400 });

  const { name, groupName, currentPassword, newPassword } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Cari şifrəni daxil edin" }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.password ?? "");
    if (!valid) {
      return NextResponse.json({ error: "Cari şifrə yanlışdır" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ name, groupName, password: hashed }).where(eq(users.id, session.user.id));
  } else {
    await db.update(users).set({ name, groupName }).where(eq(users.id, session.user.id));
  }

  return NextResponse.json({ success: true });
}
