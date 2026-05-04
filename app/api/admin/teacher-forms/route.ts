import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teacherForms, teacherFormAnswers } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { canManageForms } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!session || !canManageForms(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isAdmin = ["admin", "manager"].includes(session.user.role);

  const forms = isAdmin
    ? await db.select().from(teacherForms).orderBy(desc(teacherForms.createdAt))
    : await db.select().from(teacherForms)
        .where(eq(teacherForms.teacherId, session.user.id))
        .orderBy(desc(teacherForms.createdAt));

  // Count answers per form
  const withCounts = await Promise.all(forms.map(async (f) => {
    const answers = await db
      .select({ id: teacherFormAnswers.id })
      .from(teacherFormAnswers)
      .where(eq(teacherFormAnswers.formId, f.id));
    return { ...f, answerCount: answers.length };
  }));

  return NextResponse.json({ forms: withCounts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !canManageForms(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, questions } = await req.json() as {
    title: string;
    description?: string;
    questions: { text: string; type: "single" | "multiple" | "open"; options?: string[] }[];
  };

  if (!title?.trim()) return NextResponse.json({ error: "Başlıq tələb olunur" }, { status: 400 });
  if (!questions?.length) return NextResponse.json({ error: "Ən az 1 sual tələb olunur" }, { status: 400 });

  const [form] = await db.insert(teacherForms).values({
    teacherId:   session.user.id,
    title:       title.trim(),
    description: description?.trim() || null,
    questions:   JSON.stringify(questions),
    isActive:    true,
  }).returning({ id: teacherForms.id });

  return NextResponse.json({ success: true, id: form.id }, { status: 201 });
}
