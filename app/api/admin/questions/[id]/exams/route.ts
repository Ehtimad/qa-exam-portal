import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exams, examQuestions } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { canManageQuestions } from "@/lib/rbac";

async function requireAdmin() {
  const s = await auth();
  return canManageQuestions(s?.user?.role ?? "") ? s : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const qId = parseInt(id);

  const allExams = await db.select({ id: exams.id, title: exams.title }).from(exams).orderBy(asc(exams.title));
  const assigned = await db.select({ examId: examQuestions.examId })
    .from(examQuestions).where(eq(examQuestions.questionId, qId));

  const assignedSet = new Set(assigned.map((r) => r.examId));
  return NextResponse.json(allExams.map((e) => ({ ...e, assigned: assignedSet.has(e.id) })));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const qId = parseInt(id);
  const { examIds } = await req.json() as { examIds: string[] };

  await db.delete(examQuestions).where(eq(examQuestions.questionId, qId));

  if (examIds.length > 0) {
    await db.insert(examQuestions).values(examIds.map((eid) => ({ examId: eid, questionId: qId })));
  }

  return NextResponse.json({ success: true });
}
