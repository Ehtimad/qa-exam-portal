import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allStudents = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      groupName: users.groupName,
      groupId: users.groupId,
      emailVerified: users.emailVerified,
      isBlocked: users.isBlocked,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "student"))
    .orderBy(users.createdAt);

  return NextResponse.json(allStudents);
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, action } = await req.json();
  if (!userId || !action) return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });

  switch (action) {
    case "verify":
      await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, userId));
      break;
    case "unverify":
      await db.update(users).set({ emailVerified: null }).where(eq(users.id, userId));
      break;
    case "block":
      await db.update(users).set({ isBlocked: true }).where(eq(users.id, userId));
      break;
    case "unblock":
      await db.update(users).set({ isBlocked: false }).where(eq(users.id, userId));
      break;
    default:
      return NextResponse.json({ error: "Yanlış əməliyyat" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
