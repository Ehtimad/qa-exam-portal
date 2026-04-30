import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts, users } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { canViewResults } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!session || !canViewResults(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = await db
    .select({
      id: examAttempts.id,
      score: examAttempts.score,
      maxScore: examAttempts.maxScore,
      correctAnswers: examAttempts.correctAnswers,
      duration: examAttempts.duration,
      completedAt: examAttempts.completedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(examAttempts)
    .leftJoin(users, eq(examAttempts.userId, users.id))
    .orderBy(sql`${examAttempts.completedAt} DESC`);

  return NextResponse.json(results);
}
