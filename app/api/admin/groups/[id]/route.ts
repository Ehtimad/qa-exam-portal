import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups } from "@/lib/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const s = await auth();
  return s?.user?.role === "admin" ? s : null;
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await db.delete(groups).where(eq(groups.id, id));
  return NextResponse.json({ success: true });
}
