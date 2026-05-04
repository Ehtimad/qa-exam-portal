import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { materials } from "@/lib/schema";
import { canManageMaterials } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

async function getMaterialAndCheckOwnership(id: string, session: { user: { id: string; role: string } }) {
  const [m] = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
  if (!m) return { m: null, forbidden: false };
  const isTeacher = session.user.role === "teacher";
  if (isTeacher && m.createdBy !== session.user.id) return { m: null, forbidden: true };
  return { m, forbidden: false };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !canManageMaterials(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { m, forbidden } = await getMaterialAndCheckOwnership(id, session);
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

// SOFT DELETE — marks deleted_at instead of removing the row
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !canManageMaterials(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { m, forbidden } = await getMaterialAndCheckOwnership(id, session);
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.update(materials).set({ deletedAt: new Date() }).where(eq(materials.id, id));
  return NextResponse.json({ ok: true });
}
