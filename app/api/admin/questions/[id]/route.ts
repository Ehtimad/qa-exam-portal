import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManageQuestions } from "@/lib/rbac";

async function requireAdmin() {
  const s = await auth();
  return canManageQuestions(s?.user?.role ?? "") ? s : null;
}

const updateSchema = z.object({
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const [q] = await db.select().from(questions).where(eq(questions.id, parseInt(id))).limit(1);
  if (!q) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });
  return NextResponse.json({ ...q, options: JSON.parse(q.options), correctAnswers: JSON.parse(q.correctAnswers) });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Məlumatlar düzgün deyil" }, { status: 400 });

  const { lectureId, text, type, options, correctAnswers, difficulty, points, imageUrl, explanation } = parsed.data;

  const [q] = await db.update(questions).set({
    lectureId, text, type,
    options: JSON.stringify(options),
    correctAnswers: JSON.stringify(correctAnswers),
    difficulty, points,
    imageUrl: imageUrl ?? null,
    explanation: explanation ?? null,
  }).where(eq(questions.id, parseInt(id))).returning();

  if (!q) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });
  revalidatePath("/admin/questions");
  return NextResponse.json({ ...q, options: JSON.parse(q.options), correctAnswers: JSON.parse(q.correctAnswers) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await db.delete(questions).where(eq(questions.id, parseInt(id)));
  revalidatePath("/admin/questions");
  return NextResponse.json({ success: true });
}
