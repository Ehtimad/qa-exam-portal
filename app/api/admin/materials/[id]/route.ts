import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { materials } from "@/lib/schema";
import { canManageMaterials } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !canManageMaterials(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { title, contentUrl, groupId, startDate, endDate } = await req.json();

  const [row] = await db
    .update(materials)
    .set({
      title,
      contentUrl,
      groupId: groupId || null,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : null,
    })
    .where(eq(materials.id, id))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !canManageMaterials(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.delete(materials).where(eq(materials.id, id));
  return NextResponse.json({ ok: true });
}
