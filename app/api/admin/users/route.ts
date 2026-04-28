import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

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
      groupName: users.groupName,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "student"))
    .orderBy(users.createdAt);

  return NextResponse.json(allStudents);
}
