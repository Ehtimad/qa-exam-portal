import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { canViewResults, canManageUsers } from "@/lib/rbac";

async function requireViewResults() {
  const session = await auth();
  if (!session || !canViewResults(session.user.role)) return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireViewResults()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const [attempt] = await db
    .select({
      id: examAttempts.id,
      answers: examAttempts.answers,
      score: examAttempts.score,
      maxScore: examAttempts.maxScore,
      correctAnswers: examAttempts.correctAnswers,
      totalQuestions: examAttempts.totalQuestions,
      duration: examAttempts.duration,
      completedAt: examAttempts.completedAt,
      userName: users.name,
      userEmail: users.email,
      userGroup: users.groupName,
    })
    .from(examAttempts)
    .leftJoin(users, eq(examAttempts.userId, users.id))
    .where(eq(examAttempts.id, id))
    .limit(1);

  if (!attempt) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });
  return NextResponse.json(attempt);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.delete(examAttempts).where(eq(examAttempts.id, id));
  return NextResponse.json({ success: true });
}
