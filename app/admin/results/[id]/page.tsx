import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { questions } from "@/lib/questions";
import { ResetAttemptButton } from "../ResetButton";

export default async function AdminResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

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

  if (!attempt) notFound();

  const userAnswers: Record<string, number[]> = JSON.parse(attempt.answers);
  const pct = Math.round((attempt.score / attempt.maxScore) * 100);
  const passed = pct >= 70;
  const dur = attempt.duration
    ? `${Math.floor(attempt.duration / 60)} dəq ${attempt.duration % 60} san`
    : "–";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <Link href="/admin/results" className="text-sm text-gray-600 hover:text-gray-900">← Nəticələr</Link>
          <span className="font-semibold text-gray-900">Detallı Nəticə</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Student info + summary */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900 text-lg">{attempt.userName ?? "–"}</p>
              <p className="text-gray-500 text-sm">{attempt.userEmail}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mt-1">
                {attempt.userGroup ?? "–"}
              </span>
              <p className="text-gray-400 text-xs mt-2">
                {new Date(attempt.completedAt).toLocaleString("az-AZ")} • {dur}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
                  {attempt.score}/{attempt.maxScore}
                </div>
                <div className={`text-sm font-medium ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {pct}% — {passed ? "Keçdi" : "Kəsildi"}
                </div>
                <div className="text-xs text-gray-500">{attempt.correctAnswers}/100 düzgün</div>
              </div>
              <ResetAttemptButton attemptId={attempt.id} />
            </div>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const given = (userAnswers[String(q.id)] ?? []).slice().sort((a, b) => a - b);
            const expected = q.correctAnswers.slice().sort((a, b) => a - b);
            const isCorrect =
              given.length === expected.length && given.every((v, i) => v === expected[i]);

            return (
              <div key={q.id} className={`card border-l-4 ${isCorrect ? "border-l-green-500" : "border-l-red-400"}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-400 min-w-[2rem]">{idx + 1}.</span>
                    <p className="text-sm font-medium text-gray-900">{q.text}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}>
                    {isCorrect ? `+${q.points} bal` : "0 bal"}
                  </span>
                </div>

                <div className="space-y-1.5 ml-8">
                  {q.options.map((option, oi) => {
                    const userPicked = given.includes(oi);
                    const isRight = expected.includes(oi);

                    let cls = "text-gray-600 bg-gray-50 border-gray-200";
                    let label = "";
                    if (isRight && userPicked) {
                      cls = "text-green-800 bg-green-50 border-green-300";
                      label = "✓ Düzgün";
                    } else if (isRight && !userPicked) {
                      cls = "text-green-700 bg-green-50 border-green-200";
                      label = "✓ Düzgün cavab";
                    } else if (!isRight && userPicked) {
                      cls = "text-red-700 bg-red-50 border-red-300";
                      label = "✗ Seçdi";
                    }

                    return (
                      <div key={oi} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${cls}`}>
                        <span>{option}</span>
                        {label && <span className="text-xs font-medium ml-2 flex-shrink-0">{label}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
