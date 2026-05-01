import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { materials } from "@/lib/schema";
import { and, eq, isNull, lte, or, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/materials — materials visible to current user right now
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const groupId = session.user.groupId ?? null;

  const rows = await db
    .select()
    .from(materials)
    .where(
      and(
        lte(materials.startDate, now),
        or(isNull(materials.endDate), gte(materials.endDate, now)),
        or(isNull(materials.groupId), groupId ? eq(materials.groupId, groupId) : isNull(materials.groupId))
      )
    )
    .orderBy(sql`${materials.createdAt} DESC`);

  return NextResponse.json(rows);
}
