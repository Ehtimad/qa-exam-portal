import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { examAttempts, users } from "@/lib/schema";
import { and, eq, gte } from "drizzle-orm";

// Public endpoint — no auth required. Returns minimal info for certificate verification.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id || id.length < 10) {
    return NextResponse.json({ valid: false, error: "Yanlış ID" }, { status: 400 });
  }

  const [attempt] = await db
    .select({
      id:          examAttempts.id,
      score:       examAttempts.score,
      maxScore:    examAttempts.maxScore,
      completedAt: examAttempts.completedAt,
      userName:    users.name,
      groupName:   users.groupName,
    })
    .from(examAttempts)
    .leftJoin(users, eq(examAttempts.userId, users.id))
    .where(eq(examAttempts.id, id))
    .limit(1);

  if (!attempt) {
    return NextResponse.json({ valid: false, error: "Sertifikat tapılmadı" });
  }

  const pct = Math.round((attempt.score / attempt.maxScore) * 100);

  if (pct < 70) {
    return NextResponse.json({ valid: false, error: "Bu cəhd üçün sertifikat verilməyib (keçmə faizi < 70%)" });
  }

  return NextResponse.json({
    valid:       true,
    id:          attempt.id,
    studentName: attempt.userName ?? "Tələbə",
    groupName:   attempt.groupName ?? null,
    score:       attempt.score,
    maxScore:    attempt.maxScore,
    pct,
    completedAt: attempt.completedAt,
  });
}
