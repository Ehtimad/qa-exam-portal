import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions } from "@/lib/schema";
import { asc, eq, isNull, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManageQuestions } from "@/lib/rbac";

async function requireQManager() {
  const s = await auth();
  return canManageQuestions(s?.user?.role ?? "") ? s : null;
}

const questionSchema = z.object({
  id: z.number().int().positive().optional(),
  lectureId: z.number().int().min(1),
  text: z.string().min(5),
  type: z.enum(["single", "multiple"]),
  options: z.array(z.string().min(1)).min(2).max(8),
  correctAnswers: z.array(z.number().int().min(0)),
  difficulty: z.enum(["easy", "medium", "hard"]),
  points: z.number().int().min(1),
  imageUrl: z.string().url().optional().nullable(),
  explanation: z.string().optional().nullable(),
});

export async function GET() {
  const session = await requireQManager();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const isTeacher = session.user.role === "teacher";

  const all = await db
    .select()
    .from(questions)
    .where(
      isTeacher
        ? and(isNull(questions.deletedAt), eq(questions.teacherId, session.user.id))
        : isNull(questions.deletedAt)
    )
    .orderBy(asc(questions.lectureId), asc(questions.id));

  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const session = await requireQManager();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Məlumatlar düzgün deyil", details: parsed.error.flatten() }, { status: 400 });

  const { id, lectureId, text, type, options, correctAnswers, difficulty, points, imageUrl, explanation } = parsed.data;
  const isTeacher = session.user.role === "teacher";

  let newId = id;
  if (!newId) {
    const allIds = await db.select({ id: questions.id }).from(questions);
    newId = allIds.length > 0 ? Math.max(...allIds.map((q) => q.id)) + 1 : 1;
  }

  const [q] = await db.insert(questions).values({
    id: newId,
    lectureId,
    text,
    type,
    options: JSON.stringify(options),
    correctAnswers: JSON.stringify(correctAnswers),
    difficulty,
    points,
    imageUrl: imageUrl ?? null,
    explanation: explanation ?? null,
    teacherId: isTeacher ? session.user.id : null,
  }).returning();

  revalidatePath("/admin/questions");
  return NextResponse.json({ ...q, options: JSON.parse(q.options), correctAnswers: JSON.parse(q.correctAnswers) }, { status: 201 });
}
