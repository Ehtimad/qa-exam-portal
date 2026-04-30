import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts, users } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ResetButton } from "./ResetButton";
import { Suspense } from "react";
import ResultsFilterBar from "./ResultsFilterBar";

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string; result?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  const { q = "", group = "", result = "" } = await searchParams;

  const allResults = await db
    .select({
      id: examAttempts.id,
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
    .orderBy(sql`${examAttempts.completedAt} DESC`);

  const groups = [...new Set(allResults.map((r) => r.userGroup).filter(Boolean))] as string[];

  const results = allResults.filter((r) => {
    const pct = (r.score / r.maxScore) * 100;
    const passed = pct >= 70;
    const matchQ = !q || ((r.userName?.toLowerCase().includes(q.toLowerCase())) || (r.userEmail?.toLowerCase().includes(q.toLowerCase())));
    const matchGroup = !group || r.userGroup === group;
    const matchResult = !result || (result === "pass" ? passed : !passed);
    return matchQ && matchGroup && matchResult;
  });

  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;
  const passCount = results.filter((r) => (r.score / r.maxScore) * 100 >= 70).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">← Admin</Link>
          <span className="font-semibold text-gray-900">Nəticələr</span>
          <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-900">İstifadəçilər</Link>
          <Link href="/admin/questions" className="text-sm text-gray-500 hover:text-gray-900">Suallar</Link>
          <Link href="/admin/exams" className="text-sm text-gray-500 hover:text-gray-900">İmtahanlar</Link>
          <Link href="/admin/analytics" className="text-sm text-gray-500 hover:text-gray-900">Analitika</Link>
          <Link href="/admin/groups" className="text-sm text-gray-500 hover:text-gray-900">Qruplar</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">İmtahan Nəticələri</h1>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">{results.length} / {allResults.length} nəticə</div>
            <a
              href="/api/admin/export/results"
              className="btn-secondary text-sm py-1.5 px-3"
              download
            >
              Excel Export
            </a>
            <a
              href="/api/admin/export/pdf"
              className="btn-secondary text-sm py-1.5 px-3"
              download
            >
              PDF Export
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Göstərilən", value: results.length, color: "blue" },
            { label: "Orta bal", value: avgScore, color: "purple" },
            { label: "Keçən (≥70%)", value: passCount, color: "green" },
            { label: "Kəsilən", value: results.length - passCount, color: "red" },
          ].map((item) => (
            <div key={item.label} className="card text-center">
              <div className={`text-3xl font-bold text-${item.color}-600`}>{item.value}</div>
              <div className="text-gray-500 text-sm mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        <Suspense>
          <ResultsFilterBar groups={groups} />
        </Suspense>

        <div className="card">
          {results.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              {allResults.length === 0 ? "Hələ heç bir nəticə yoxdur" : "Filter nəticəsi tapılmadı"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 text-gray-500 font-medium">Tələbə</th>
                    <th className="text-left py-3 text-gray-500 font-medium">Qrup</th>
                    <th className="text-right py-3 text-gray-500 font-medium">Bal</th>
                    <th className="text-right py-3 text-gray-500 font-medium">Faiz</th>
                    <th className="text-right py-3 text-gray-500 font-medium">Düzgün</th>
                    <th className="text-right py-3 text-gray-500 font-medium">Müddət</th>
                    <th className="text-center py-3 text-gray-500 font-medium">Nəticə</th>
                    <th className="text-right py-3 text-gray-500 font-medium">Tarix</th>
                    <th className="text-right py-3 text-gray-500 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const pct = Math.round((r.score / r.maxScore) * 100);
                    const passed = pct >= 70;
                    const dur = r.duration
                      ? `${Math.floor(r.duration / 60)}d ${r.duration % 60}s`
                      : "–";
                    return (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3">
                          <div className="font-medium text-gray-900">{r.userName ?? "–"}</div>
                          <div className="text-gray-400 text-xs">{r.userEmail}</div>
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {r.userGroup ?? "–"}
                          </span>
                        </td>
                        <td className="py-3 text-right font-semibold text-blue-600">
                          {r.score}/{r.maxScore}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`font-medium ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-600">{r.correctAnswers}/100</td>
                        <td className="py-3 text-right text-gray-500">{dur}</td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                          }`}>
                            {passed ? "Keçdi" : "Kəsildi"}
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-500 text-xs">
                          {new Date(r.completedAt).toLocaleString("az-AZ")}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/results/${r.id}`}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Detallı
                            </Link>
                            <ResetButton attemptId={r.id} />
                          </div>
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
