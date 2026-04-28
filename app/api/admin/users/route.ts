import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = z
    .object({ userId: z.string(), approved: z.boolean() })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ approved: parsed.data.approved })
    .where(eq(users.id, parsed.data.userId));

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allStudents = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      approved: users.approved,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "student"))
    .orderBy(users.createdAt);

  return NextResponse.json(allStudents);
}
