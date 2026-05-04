import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { materials } from "@/lib/schema";
import { canManageMaterials } from "@/lib/rbac";
import { desc, isNull, eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canManageMaterials(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isTeacher = session.user.role === "teacher";
  const rows = await db.select().from(materials)
    .where(
      isTeacher
        ? and(isNull(materials.deletedAt), eq(materials.createdBy, session.user.id))
        : isNull(materials.deletedAt)
    )
    .orderBy(desc(materials.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageMaterials(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, contentUrl, groupId, startDate, endDate } = await req.json();
  if (!title || !contentUrl) {
    return NextResponse.json({ error: "title and contentUrl required" }, { status: 400 });
  }

  const [row] = await db
    .insert(materials)
    .values({
      title,
      contentUrl,
      groupId: groupId || null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(row);
}
