import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManageGroups } from "@/lib/rbac";

async function requireAdmin() {
  const s = await auth();
  return canManageGroups(s?.user?.role ?? "") ? s : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { name } = await req.json();
  const parsed = z.string().min(1).max(100).safeParse(name);
  if (!parsed.success) return NextResponse.json({ error: "Yanlış ad" }, { status: 400 });

  const [g] = await db.update(groups).set({ name: parsed.data }).where(eq(groups.id, id)).returning();
  if (!g) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });
  revalidatePath("/admin/groups");
  revalidatePath("/admin/users");
  return NextResponse.json(g);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await db.delete(groups).where(eq(groups.id, id));
  revalidatePath("/admin/groups");
  revalidatePath("/admin/users");
  return NextResponse.json({ success: true });
}
