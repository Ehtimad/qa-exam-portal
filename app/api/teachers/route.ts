import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const teachers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.role, "teacher"))
    .orderBy(asc(users.name));

  return NextResponse.json(
    teachers.filter((t) => t.name)
  );
}
