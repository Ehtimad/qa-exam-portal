import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teacherForms, teacherFormAnswers, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { canManageForms } from "@/lib/rbac";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !canManageForms(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [form] = await db.select().from(teacherForms).where(eq(teacherForms.id, id)).limit(1);
  if (!form) return NextResponse.json({ error: "Sorğu tapılmadı" }, { status: 404 });

  const isAdmin = ["admin", "manager"].includes(session.user.role);
  if (!isAdmin && form.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const answers = await db
    .select({
      id:          teacherFormAnswers.id,
      studentId:   teacherFormAnswers.studentId,
      answers:     teacherFormAnswers.answers,
      submittedAt: teacherFormAnswers.submittedAt,
    })
    .from(teacherFormAnswers)
    .where(eq(teacherFormAnswers.formId, id));

  const studentIds = [...new Set(answers.map((a) => a.studentId))];
  const studentRows = studentIds.length > 0
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users)
    : [];
  const studentMap = Object.fromEntries(studentRows.map((u) => [u.id, u]));

  const enriched = answers.map((a) => ({
    ...a,
    student: studentMap[a.studentId] ?? { id: a.studentId, name: "Silinmiş", email: "" },
    answers: JSON.parse(a.answers),
  }));

  return NextResponse.json({ form: { ...form, questions: JSON.parse(form.questions) }, answers: enriched });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !canManageForms(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [form] = await db.select().from(teacherForms).where(eq(teacherForms.id, id)).limit(1);
  if (!form) return NextResponse.json({ error: "Sorğu tapılmadı" }, { status: 404 });

  const isAdmin = ["admin", "manager"].includes(session.user.role);
  if (!isAdmin && form.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updates: Partial<typeof form> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (body.questions !== undefined) updates.questions = JSON.stringify(body.questions);

  await db.update(teacherForms).set(updates).where(eq(teacherForms.id, id));
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !canManageForms(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [form] = await db.select().from(teacherForms).where(eq(teacherForms.id, id)).limit(1);
  if (!form) return NextResponse.json({ error: "Sorğu tapılmadı" }, { status: 404 });

  const isAdmin = ["admin", "manager"].includes(session.user.role);
  if (!isAdmin && form.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(teacherForms).where(eq(teacherForms.id, id));
  return NextResponse.json({ success: true });
}
