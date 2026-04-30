import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, questionGroups } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const s = await auth();
  return s?.user?.role === "admin" ? s : null;
}

// GET: returns all groups with assigned=true/false for this question
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const qId = parseInt(id);

  const allGroups = await db.select().from(groups).orderBy(asc(groups.name));
  const assigned = await db.select({ groupId: questionGroups.groupId })
    .from(questionGroups).where(eq(questionGroups.questionId, qId));

  const assignedSet = new Set(assigned.map((r) => r.groupId));
  return NextResponse.json(allGroups.map((g) => ({ ...g, assigned: assignedSet.has(g.id) })));
}

// PUT: { groupIds: string[] } — replaces all group assignments for this question
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const qId = parseInt(id);
  const { groupIds } = await req.json() as { groupIds: string[] };

  await db.delete(questionGroups).where(eq(questionGroups.questionId, qId));
  if (groupIds.length > 0) {
    await db.insert(questionGroups).values(groupIds.map((gId) => ({ questionId: qId, groupId: gId })));
  }

  revalidatePath("/admin/questions");
  return NextResponse.json({ success: true });
}
