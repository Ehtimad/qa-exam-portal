import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { advertisements } from "@/lib/schema";
import { canManageAds } from "@/lib/rbac";
import { pusher } from "@/lib/pusher";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !canManageAds(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { title, content, targetRole, isActive } = await req.json();

  const [row] = await db
    .update(advertisements)
    .set({ title, content, targetRole, isActive })
    .where(eq(advertisements.id, id))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await pusher.trigger("advertisements", "ad-updated", row);
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !canManageAds(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.delete(advertisements).where(eq(advertisements.id, id));
  await pusher.trigger("advertisements", "ad-deleted", { id });
  return NextResponse.json({ ok: true });
}
