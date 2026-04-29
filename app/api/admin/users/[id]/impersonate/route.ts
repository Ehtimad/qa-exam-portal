import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, impersonationTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const [target] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1);
  if (!target) return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });
  if (target.role === "admin") return NextResponse.json({ error: "Admin hesabına keçid mümkün deyil" }, { status: 403 });

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await db.insert(impersonationTokens).values({
    token,
    adminId: session.user.id,
    targetUserId: id,
    expiresAt,
  });

  return NextResponse.json({ token });
}
