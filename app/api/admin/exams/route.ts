import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exams, examQuestions, groups, questions } from "@/lib/schema";
import { asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function requireAdmin() {
  const s = await auth();
  return s?.user?.role === "admin" ? s : null;
}

const examSchema = z.object({
  title: z.string().min(2).max(200),
  groupId: z.string().nullable().optional(),
  timeLimitMinutes: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  questionIds: z.array(z.number().int().positive()).optional(),
});

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allExams = await db.select({
    id: exams.id,
    title: exams.title,
    groupId: exams.groupId,
    timeLimitMinutes: exams.timeLimitMinutes,
    isActive: exams.isActive,
    shuffleQuestions: exams.shuffleQuestions,
    shuffleOptions: exams.shuffleOptions,
    createdAt: exams.createdAt,
    groupName: groups.name,
  })
    .from(exams)
    .leftJoin(groups, eq(exams.groupId, groups.id))
    .orderBy(asc(exams.createdAt));

  // Get question counts
  const eqRows = await db.select({ examId: examQuestions.examId }).from(examQuestions);
  const countMap: Record<string, number> = {};
  for (const r of eqRows) {
    countMap[r.examId] = (countMap[r.examId] ?? 0) + 1;
  }

  return NextResponse.json(allExams.map((e) => ({ ...e, questionCount: countMap[e.id] ?? 0 })));
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parsed = examSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Məlumatlar düzgün deyil" }, { status: 400 });

  const { title, groupId, timeLimitMinutes, isActive = false, shuffleQuestions = true, shuffleOptions = true, questionIds = [] } = parsed.data;

  const [exam] = await db.insert(exams).values({
    id: crypto.randomUUID(),
    title,
    groupId: groupId ?? null,
    timeLimitMinutes: timeLimitMinutes ?? null,
    isActive,
    shuffleQuestions,
    shuffleOptions,
  }).returning();

  if (questionIds.length > 0) {
    await db.insert(examQuestions).values(questionIds.map((qId) => ({ examId: exam.id, questionId: qId })));
  }

  revalidatePath("/admin/exams");
  return NextResponse.json(exam, { status: 201 });
}
