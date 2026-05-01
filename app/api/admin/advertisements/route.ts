import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { advertisements } from "@/lib/schema";
import { canManageAds } from "@/lib/rbac";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canManageAds(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db.select().from(advertisements).orderBy(desc(advertisements.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageAds(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, content, targetRole, isActive } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }

  const [row] = await db
    .insert(advertisements)
    .values({ title, content, targetRole: targetRole ?? "all", isActive: isActive ?? true })
    .returning();

  return NextResponse.json(row);
}
