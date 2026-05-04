import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teacherForms, teacherFormAnswers, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Return active forms assigned to this student's teacher
  const [student] = await db
    .select({ teacherId: users.teacherId })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!student?.teacherId) {
    return NextResponse.json({ forms: [] });
  }

  const forms = await db
    .select()
    .from(teacherForms)
    .where(eq(teacherForms.teacherId, student.teacherId));

  const activeForms = forms.filter((f) => f.isActive);

  // Which ones has the student already answered?
  const answered = await db
    .select({ formId: teacherFormAnswers.formId })
    .from(teacherFormAnswers)
    .where(eq(teacherFormAnswers.studentId, session.user.id));

  const answeredIds = new Set(answered.map((a) => a.formId));

  const enriched = activeForms.map((f) => ({
    ...f,
    questions: JSON.parse(f.questions),
    answered: answeredIds.has(f.id),
  }));

  return NextResponse.json({ forms: enriched });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { formId, answers } = await req.json() as {
    formId: string;
    answers: Record<string, string | string[]>;
  };

  if (!formId || !answers) {
    return NextResponse.json({ error: "formId və answers tələb olunur" }, { status: 400 });
  }

  const [form] = await db.select().from(teacherForms).where(eq(teacherForms.id, formId)).limit(1);
  if (!form || !form.isActive) {
    return NextResponse.json({ error: "Sorğu tapılmadı və ya aktiv deyil" }, { status: 404 });
  }

  // Prevent duplicate submission
  const [existing] = await db
    .select({ id: teacherFormAnswers.id })
    .from(teacherFormAnswers)
    .where(and(
      eq(teacherFormAnswers.formId, formId),
      eq(teacherFormAnswers.studentId, session.user.id)
    ))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Bu sorğuya artıq cavab vermişsiniz" }, { status: 409 });
  }

  await db.insert(teacherFormAnswers).values({
    formId,
    studentId: session.user.id,
    answers: JSON.stringify(answers),
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
