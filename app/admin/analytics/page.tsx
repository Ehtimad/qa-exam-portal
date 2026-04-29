import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, examAttempts, questions } from "@/lib/schema";
import { desc, gte } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";

const LECTURE_NAMES: Record<number, string> = {
  1: "Testing Əsasları", 2: "SDLC-də Test", 3: "Statik Test",
  4: "Test Analizi", 5: "Test İdarəetməsi", 6: "Test Alətləri", 7: "Yekun Mövzular",
};

export const revalidate = 0;

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  // --- Online Users (last 5 min) ---
  let onlineUsers: Array<{ id: string; name: string | null; email: string; groupName: string | null; lastSeenAt: Date | null }> = [];
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    onlineUsers = await db
      .select({ id: users.id, name: users.name, email: users.email, groupName: users.groupName, lastSeenAt: users.lastSeenAt })
      .from(users)
      .where(gte(users.lastSeenAt, fiveMinAgo))
      .orderBy(desc(users.lastSeenAt));
  } catch { /* column may not exist yet */ }

  // --- Attempt + Question analysis ---
  type QStat = { id: number; text: string; lectureId: number; attempts: number; errors: number; errorRate: number; points: number };
  type LecStat = { lectureId: number; totalAttempts: number; totalErrors: number; errorRate: number };

  let qStatsArr: QStat[] = [];
  let lecStats: LecStat[] = [];
  let top10Hardest: QStat[] = [];
  let analysisError = false;

  try {
    const attempts = await db
      .select({
        answers: examAttempts.answers,
        questionOrder: examAttempts.questionOrder,
        optionOrders: examAttempts.optionOrders,
      })
      .from(examAttempts);

    const allQuestions = await db.select().from(questions);
    const qMap = new Map(allQuestions.map((q) => [
      q.id,
      { ...q, options: JSON.parse(q.options) as string[], correctAnswers: JSON.parse(q.correctAnswers) as number[] },
    ]));

    const qStats = new Map<number, { attempts: number; errors: number; points: number; text: string; lectureId: number }>();

    for (const attempt of attempts) {
      const answers = JSON.parse(attempt.answers) as Record<string, number[]>;
      const questionOrder: number[] = attempt.questionOrder
        ? JSON.parse(attempt.questionOrder)
        : Object.keys(answers).map(Number);
      const optionOrders: Record<string, number[]> = attempt.optionOrders
        ? JSON.parse(attempt.optionOrders)
        : {};

      for (const qId of questionOrder) {
        const q = qMap.get(qId);
        if (!q) continue;
        if (!qStats.has(qId)) qStats.set(qId, { attempts: 0, errors: 0, points: q.points, text: q.text, lectureId: q.lectureId });
        const stat = qStats.get(qId)!;
        stat.attempts++;

        const displayAnswers = answers[String(qId)] ?? [];
        const optOrder = optionOrders[String(qId)] ?? Array.from({ length: q.options.length }, (_, i) => i);
        const originalAnswers = displayAnswers.map((di) => optOrder[di] ?? di);
        const correctSet = new Set(q.correctAnswers);

        let isCorrect = false;
        if (q.type === "single") {
          isCorrect = originalAnswers.length === 1 && correctSet.has(originalAnswers[0]);
        } else {
          const correctHits = originalAnswers.filter((a) => correctSet.has(a)).length;
          const wrongHits = originalAnswers.filter((a) => !correctSet.has(a)).length;
          isCorrect = correctHits === q.correctAnswers.length && wrongHits === 0;
        }
        if (!isCorrect) stat.errors++;
      }
    }

    qStatsArr = Array.from(qStats.entries())
      .map(([id, s]) => ({
        id, text: s.text, lectureId: s.lectureId, attempts: s.attempts,
        errors: s.errors, errorRate: s.attempts > 0 ? Math.round(s.errors / s.attempts * 100) : 0,
        points: s.points,
      }))
      .sort((a, b) => b.errorRate - a.errorRate);

    const lecMap = new Map<number, { total: number; errors: number }>();
    for (const stat of qStatsArr) {
      if (!lecMap.has(stat.lectureId)) lecMap.set(stat.lectureId, { total: 0, errors: 0 });
      const l = lecMap.get(stat.lectureId)!;
      l.total += stat.attempts;
      l.errors += stat.errors;
    }
    lecStats = Array.from(lecMap.entries())
      .map(([lectureId, s]) => ({
        lectureId, totalAttempts: s.total, totalErrors: s.errors,
        errorRate: s.total > 0 ? Math.round(s.errors / s.total * 100) : 0,
      }))
      .sort((a, b) => b.errorRate - a.errorRate);

    top10Hardest = qStatsArr.filter((q) => q.attempts >= 3).slice(0, 10);
  } catch {
    analysisError = true;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6 flex-wrap">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">← Admin</Link>
          <span className="font-semibold text-gray-900">Analitika</span>
          <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-900">İstifadəçilər</Link>
          <Link href="/admin/results" className="text-sm text-gray-500 hover:text-gray-900">Nəticələr</Link>
          <Link href="/admin/questions" className="text-sm text-gray-500 hover:text-gray-900">Suallar</Link>
          <Link href="/admin/exams" className="text-sm text-gray-500 hover:text-gray-900">İmtahanlar</Link>
          <Link href="/admin/groups" className="text-sm text-gray-500 hover:text-gray-900">Qruplar</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Online Users */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Online İstifadəçilər
            <span className="ml-2 text-sm font-normal text-gray-500">(son 5 dəqiqə)</span>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              {onlineUsers.length} aktiv
            </span>
          </h2>
          <div className="card">
            {onlineUsers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Hazırda aktiv istifadəçi yoxdur</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-3 py-3 text-gray-500 font-medium">Ad Soyad</th>
                      <th className="text-left px-3 py-3 text-gray-500 font-medium">Qrup</th>
                      <th className="text-left px-3 py-3 text-gray-500 font-medium">Son aktivlik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onlineUsers.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></span>
                            <span className="font-medium text-gray-900">{u.name ?? "–"}</span>
                            <span className="text-gray-400 text-xs">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-500">{u.groupName ?? "–"}</td>
                        <td className="px-3 py-3 text-gray-500">
                          {u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleTimeString("az-AZ") : "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {analysisError ? (
          <div className="card">
            <p className="text-amber-600 text-sm text-center py-6">
              Sual analizi üçün məlumat yüklənə bilmədi. Sistem yenilənir, bir az sonra yenidən cəhd edin.
            </p>
          </div>
        ) : (
          <>
            {/* Lecture error analysis */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Mühazirə üzrə Xəta Analizi</h2>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-3 py-3 text-gray-500 font-medium">Mühazirə</th>
                        <th className="text-right px-3 py-3 text-gray-500 font-medium">Cəhd sayı</th>
                        <th className="text-right px-3 py-3 text-gray-500 font-medium">Xəta sayı</th>
                        <th className="text-right px-3 py-3 text-gray-500 font-medium">Xəta %</th>
                        <th className="px-3 py-3 text-gray-500 font-medium">Proqres</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lecStats.map((l) => (
                        <tr key={l.lectureId} className="border-b border-gray-50">
                          <td className="px-3 py-3 font-medium text-gray-900">
                            M{l.lectureId}: {LECTURE_NAMES[l.lectureId] ?? `Mühazirə ${l.lectureId}`}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-600">{l.totalAttempts}</td>
                          <td className="px-3 py-3 text-right text-gray-600">{l.totalErrors}</td>
                          <td className="px-3 py-3 text-right">
                            <span className={`font-medium ${l.errorRate >= 70 ? "text-red-600" : l.errorRate >= 40 ? "text-amber-600" : "text-green-600"}`}>
                              {l.errorRate}%
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="w-32 bg-gray-100 rounded-full h-2">
                              <div className={`h-2 rounded-full ${l.errorRate >= 70 ? "bg-red-400" : l.errorRate >= 40 ? "bg-amber-400" : "bg-green-400"}`}
                                style={{ width: `${l.errorRate}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                      {lecStats.length === 0 && (
                        <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">Məlumat yoxdur</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Top 10 hardest */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ən Çətin 10 Sual <span className="text-sm font-normal text-gray-400">(ən az 3 cəhd)</span></h2>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-3 py-3 text-gray-500 font-medium w-8">#</th>
                        <th className="text-left px-3 py-3 text-gray-500 font-medium">Sual</th>
                        <th className="text-left px-3 py-3 text-gray-500 font-medium">Mühazirə</th>
                        <th className="text-right px-3 py-3 text-gray-500 font-medium">Cəhd</th>
                        <th className="text-right px-3 py-3 text-gray-500 font-medium">Xəta %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top10Hardest.map((q, i) => (
                        <tr key={q.id} className="border-b border-gray-50">
                          <td className="px-3 py-3 text-gray-400">{i + 1}</td>
                          <td className="px-3 py-3 text-gray-900 max-w-sm">
                            <span className="line-clamp-2">{q.text}</span>
                          </td>
                          <td className="px-3 py-3 text-gray-500">M{q.lectureId}</td>
                          <td className="px-3 py-3 text-right text-gray-600">{q.attempts}</td>
                          <td className="px-3 py-3 text-right">
                            <span className={`font-bold ${q.errorRate >= 70 ? "text-red-600" : q.errorRate >= 40 ? "text-amber-600" : "text-green-600"}`}>
                              {q.errorRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {top10Hardest.length === 0 && (
                        <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">Məlumat yoxdur</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
