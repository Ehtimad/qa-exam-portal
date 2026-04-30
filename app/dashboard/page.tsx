import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts, examSessions, exams, examQuestions, questions, users, questionGroups } from "@/lib/schema";
import { eq, desc, and, or, isNull, inArray, sum } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";

async function getDynamicMaxScore(groupId: string | null | undefined): Promise<number> {
  try {
    // 1. Check for active exam assigned to user's group (or global)
    const activeExams = await db
      .select({ id: exams.id, groupId: exams.groupId })
      .from(exams)
      .where(and(
        eq(exams.isActive, true),
        or(
          groupId ? eq(exams.groupId, groupId) : isNull(exams.groupId),
          isNull(exams.groupId)
        )
      ));

    const exam = activeExams.find((e) => e.groupId === groupId) ?? activeExams.find((e) => !e.groupId) ?? null;

    let questionIds: number[] = [];

    if (exam) {
      const rows = await db.select({ questionId: examQuestions.questionId })
        .from(examQuestions).where(eq(examQuestions.examId, exam.id));
      questionIds = rows.map((r) => r.questionId);
    } else if (groupId) {
      // 2. Fall back to question_groups M2M
      const rows = await db.select({ questionId: questionGroups.questionId })
        .from(questionGroups).where(eq(questionGroups.groupId, groupId));
      questionIds = rows.map((r) => r.questionId);
    }

    if (questionIds.length === 0) {
      // 3. All questions fallback
      const [res] = await db.select({ total: sum(questions.points) }).from(questions);
      return Number(res?.total ?? 500);
    }

    const [res] = await db.select({ total: sum(questions.points) })
      .from(questions).where(inArray(questions.id, questionIds));
    return Number(res?.total ?? 500);
  } catch {
    return 500;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const [userRow] = await db.select({ groupId: users.groupId }).from(users).where(eq(users.id, session.user.id)).limit(1);
  const groupId = userRow?.groupId ?? null;

  const attempts = await db
    .select()
    .from(examAttempts)
    .where(eq(examAttempts.userId, session.user.id))
    .orderBy(desc(examAttempts.completedAt))
    .limit(10);

  const [activeSession] = await db
    .select({ id: examSessions.id })
    .from(examSessions)
    .where(and(eq(examSessions.userId, session.user.id), eq(examSessions.status, "in_progress")))
    .limit(1);

  const dynamicMax = await getDynamicMaxScore(groupId);

  const hasAttempt = attempts.length > 0;
  const bestScore = hasAttempt ? Math.max(...attempts.map((a) => a.score)) : 0;
  const hasActiveSession = !!activeSession;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold text-gray-900">QA Exam Portal</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.user.name}</span>
            {session.user.impersonatedBy && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-medium">
                Admin görünüşü
              </span>
            )}
            <Link href="/profile" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Məlumatlarım</Link>
            {session.user.role === "admin" && (
              <Link href="/admin" className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors">
                Admin Panel
              </Link>
            )}
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="btn-secondary text-sm py-1.5 px-3">Çıxış</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Şəxsi Kabinet</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600">{attempts.length}</div>
            <div className="text-gray-500 text-sm mt-1">İmtahan cəhdi</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600">{bestScore}</div>
            <div className="text-gray-500 text-sm mt-1">Ən yüksək bal</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-purple-600">{dynamicMax}</div>
            <div className="text-gray-500 text-sm mt-1">Maksimum bal</div>
          </div>
        </div>

        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">İmtahan</h2>
              <p className="text-gray-500 text-sm mt-1">
                Maksimum {dynamicMax} bal
              </p>
            </div>
            {hasAttempt ? (
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-500">
                  İştirak etdiniz
                </span>
                <p className="text-xs text-gray-400 mt-1">Yenidən iştirak mümkün deyil</p>
              </div>
            ) : hasActiveSession ? (
              <div className="text-right">
                <Link href="/exam" className="btn-primary bg-amber-600 hover:bg-amber-700">
                  Davam et →
                </Link>
                <p className="text-xs text-amber-600 mt-1">Yarımçıq imtahan var</p>
              </div>
            ) : (
              <Link href="/exam" className="btn-primary">
                İmtahana başla →
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Keçmiş nəticələr</h2>
          {attempts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Hələ heç bir imtahan verməmisiniz</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Tarix</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Bal</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Faiz</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Düzgün</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Müddət</th>
                    <th className="text-right py-2 text-gray-500 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => {
                    const pct = Math.round((attempt.score / attempt.maxScore) * 100);
                    const dur = attempt.duration
                      ? `${Math.floor(attempt.duration / 60)}d ${attempt.duration % 60}s`
                      : "–";
                    return (
                      <tr key={attempt.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 text-gray-600">
                          {new Date(attempt.completedAt).toLocaleString("az-AZ")}
                        </td>
                        <td className="py-3 text-right font-semibold text-blue-600">
                          {attempt.score}/{attempt.maxScore}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`font-medium ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {attempt.correctAnswers}/{attempt.totalQuestions}
                        </td>
                        <td className="py-3 text-right text-gray-500">{dur}</td>
                        <td className="py-3 text-right">
                          <Link href={`/dashboard/results/${attempt.id}`}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                            Detallı bax →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
