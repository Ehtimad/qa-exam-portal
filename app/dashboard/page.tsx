import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts, examSessions } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";

const MAX_SCORE = 500;

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const attempts = await db
    .select()
    .from(examAttempts)
    .where(eq(examAttempts.userId, session.user.id))
    .orderBy(desc(examAttempts.completedAt))
    .limit(10);

  // Check for in-progress session
  const [activeSession] = await db
    .select({ id: examSessions.id })
    .from(examSessions)
    .where(and(eq(examSessions.userId, session.user.id), eq(examSessions.status, "in_progress")))
    .limit(1);

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
            <div className="text-3xl font-bold text-purple-600">{MAX_SCORE}</div>
            <div className="text-gray-500 text-sm mt-1">Maksimum bal</div>
          </div>
        </div>

        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">İmtahan</h2>
              <p className="text-gray-500 text-sm mt-1">
                Maksimum {MAX_SCORE} bal
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
