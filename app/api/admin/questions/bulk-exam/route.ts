import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examQuestions } from "@/lib/schema";
import { canManageQuestions } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const s = await auth();
  if (!s || !canManageQuestions(s?.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { questionIds, examIds } = await req.json() as { questionIds: number[]; examIds: string[] };

  if (!questionIds?.length || !examIds?.length) {
    return NextResponse.json({ error: "questionIds and examIds required" }, { status: 400 });
  }

  const values = questionIds.flatMap((qId) =>
    examIds.map((examId) => ({ examId, questionId: qId }))
  );

  await db.insert(examQuestions).values(values).onConflictDoNothing();

  return NextResponse.json({ success: true, assigned: values.length });
}
