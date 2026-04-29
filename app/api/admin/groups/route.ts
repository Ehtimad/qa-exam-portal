import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups } from "@/lib/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";

async function requireAdmin() {
  const s = await auth();
  return s?.user?.role === "admin" ? s : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const all = await db.select().from(groups).orderBy(asc(groups.name));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name } = await req.json();
  const parsed = z.string().min(1).max(100).safeParse(name);
  if (!parsed.success) return NextResponse.json({ error: "Yanlış ad" }, { status: 400 });

  const [g] = await db.insert(groups).values({
    id: crypto.randomUUID(),
    name: parsed.data,
  }).returning();
  return NextResponse.json(g, { status: 201 });
}
