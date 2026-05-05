import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, users } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { canManageQuestions } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !canManageQuestions(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only admins/managers can bulk-assign to any teacher; teachers cannot reassign
  if (session.user.role === "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { questionIds, teacherId } = await req.json();
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return NextResponse.json({ error: "questionIds tələb olunur" }, { status: 400 });
  }

  // Validate teacher exists
  if (teacherId) {
    const [teacher] = await db.select({ id: users.id }).from(users)
      .where(eq(users.id, teacherId)).limit(1);
    if (!teacher) return NextResponse.json({ error: "Müəllim tapılmadı" }, { status: 400 });
  }

  await db.update(questions)
    .set({ teacherId: teacherId ?? null })
    .where(inArray(questions.id, questionIds));

  revalidatePath("/admin/questions");
  return NextResponse.json({ updated: questionIds.length });
}
