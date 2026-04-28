import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { MAX_SCORE } from "@/lib/questions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const attempts = await db
    .select()
    .from(examAttempts)
    .where(eq(examAttempts.userId, session.user.id))
    .orderBy(desc(examAttempts.completedAt))
    .limit(10);

  const bestScore = attempts.length
    ? Math.max(...attempts.map((a) => a.score))
    : 0;
  const lastAttempt = attempts[0] ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold text-gray-900">
            QA Exam Portal
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.user.name}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="btn-secondary text-sm py-1.5 px-3">
                Çıxış
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Şəxsi Kabinet
        </h1>

        {!session.user.approved && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-amber-800">Hesabınız gözləmə vəziyyətindədir</h3>
                <p className="text-amber-700 text-sm mt-1">
                  Admin tərəfindən təsdiq edildikdən sonra imtahana başlaya bilərsiniz.
                </p>
              </div>
            </div>
          </div>
        )}

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

        {session.user.approved && (
          <div className="card mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">İmtahana başla</h2>
                <p className="text-gray-500 text-sm mt-1">
                  100 sual • 7 mühazirə • Maksimum {MAX_SCORE} bal
                </p>
              </div>
              <Link href="/exam" className="btn-primary">
                İmtahana başla →
              </Link>
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Keçmiş nəticələr
          </h2>
          {attempts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              Hələ heç bir imtahan verməmisiniz
            </p>
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
                          {attempt.correctAnswers}/100
                        </td>
                        <td className="py-3 text-right text-gray-500">{dur}</td>
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
