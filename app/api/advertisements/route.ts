import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { advertisements } from "@/lib/schema";
import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/advertisements — active ads for current user's role
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;

  const rows = await db
    .select()
    .from(advertisements)
    .where(
      and(
        eq(advertisements.isActive, true),
        or(eq(advertisements.targetRole, "all"), eq(advertisements.targetRole, role))
      )
    );

  return NextResponse.json(rows);
}
