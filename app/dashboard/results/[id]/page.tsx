import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { examAttempts, questions } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const { id } = await params;

  const [attempt] = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.id, id), eq(examAttempts.userId, session.user.id)))
    .limit(1);

  if (!attempt) notFound();

  const userAnswers: Record<string, number[]> = JSON.parse(attempt.answers);
  const questionOrder: number[] = attempt.questionOrder ? JSON.parse(attempt.questionOrder) : [];
  const optionOrders: Record<string, number[]> = attempt.optionOrders ? JSON.parse(attempt.optionOrders) : {};

  const pct = Math.round((attempt.score / attempt.maxScore) * 100);
  const passed = pct >= 70;

  const dur = attempt.duration
    ? `${Math.floor(attempt.duration / 60)} dəq ${attempt.duration % 60} san`
    : "–";

  // Load DB questions (with explanation)
  const displayOrder = questionOrder.length > 0 ? questionOrder : [];
  const dbQs = displayOrder.length > 0
    ? await db.select({ id: questions.id, text: questions.text, options: questions.options, correctAnswers: questions.correctAnswers, points: questions.points, explanation: questions.explanation })
        .from(questions).where(inArray(questions.id, displayOrder))
    : [];

  const qMap = new Map(dbQs.map((q) => [q.id, q]));

  const orderedQs = displayOrder.length > 0
    ? displayOrder.map((qid) => qMap.get(qid)).filter(Boolean)
    : dbQs;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">← Kabinet</Link>
          <span className="font-semibold text-gray-900">İmtahan Nəticəsi</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Summary */}
        <div className="card mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className={`text-3xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
                  {attempt.score}/{attempt.maxScore}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}>
                  {passed ? "Keçdi" : "Kəsildi"}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                {attempt.correctAnswers} düzgün / {attempt.totalQuestions} sual • {pct}% • {dur}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {new Date(attempt.completedAt).toLocaleString("az-AZ")}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div>
                <div className="text-sm text-gray-500">Nəticə</div>
                <div className={`text-5xl font-bold ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {pct}%
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/user/result/${attempt.id}`}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Nəticəni PDF Yüklə
                </a>
                {passed && (
                  <a
                    href={`/api/user/certificate/${attempt.id}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-green-400 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                  >
                    Sertifikat Yüklə
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-4">
          {orderedQs.map((q, idx) => {
            if (!q) return null;
            const correctAnswers: number[] = JSON.parse(q.correctAnswers);
            const optionOrder = optionOrders[String(q.id)] ?? Array.from({ length: 10 }, (_, i) => i);
            const displayGiven = userAnswers[String(q.id)] ?? [];
            const originalGiven = displayGiven.map((di) => optionOrder[di] ?? di);
            const options: string[] = JSON.parse(q.options);

            const isCorrect =
              originalGiven.length === correctAnswers.length &&
              [...originalGiven].sort((a, b) => a - b).every((v, i) => v === [...correctAnswers].sort((a, b) => a - b)[i]);

            return (
              <div key={q.id} className={`card border-l-4 ${isCorrect ? "border-l-green-500" : "border-l-red-400"}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-400 min-w-[2rem]">{idx + 1}.</span>
                    <p className="text-sm font-medium text-gray-900">{q.text}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}>
                      {isCorrect ? `+${q.points} bal` : "0 bal"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 ml-8">
                  {options.map((option, oi) => {
                    const userPicked = originalGiven.includes(oi);
                    const isRight = correctAnswers.includes(oi);

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
                      label = "✗ Seçdiniz";
                    }

                    return (
                      <div key={oi} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${cls}`}>
                        <span>{option}</span>
                        {label && <span className="text-xs font-medium ml-2 flex-shrink-0">{label}</span>}
                      </div>
                    );
                  })}
                </div>

                {!isCorrect && q.explanation && (
                  <div className="ml-8 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-700 mb-1">İzahat:</p>
                    <p className="text-sm text-amber-800">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
