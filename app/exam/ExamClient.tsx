"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/lib/questions";

const LECTURE_NAMES: Record<number, string> = {
  1: "Testing Əsasları",
  2: "SDLC-də Test",
  3: "Statik Test",
  4: "Test Analizi",
  5: "Test İdarəetməsi",
  6: "Test Alətləri",
  7: "Yekun Mövzular",
};

interface Props {
  questions: Question[];
  userId: string;
}

export default function ExamClient({ questions, userId }: Props) {
  const router = useRouter();
  const startTime = useRef(Date.now());
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const question = questions[current];
  const answered = answers[question.id] ?? [];
  const answeredCount = Object.keys(answers).length;
  function toggleAnswer(idx: number) {
    setAnswers((prev) => {
      const cur = prev[question.id] ?? [];
      if (question.type === "single") {
        return { ...prev, [question.id]: [idx] };
      }
      if (cur.includes(idx)) {
        return { ...prev, [question.id]: cur.filter((i) => i !== idx) };
      }
      return { ...prev, [question.id]: [...cur, idx] };
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");

    const duration = Math.floor((Date.now() - startTime.current) / 1000);

    const res = await fetch("/api/exam/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, duration }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/dashboard/results/${data.attemptId}`);
      router.refresh();
    } else {
      const d = await res.json();
      setSubmitError(d.error ?? "Göndərmə xətası");
      setSubmitting(false);
    }
  }

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  // Lectures for sidebar
  const lectureNums = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="font-semibold text-gray-900">QA İmtahan</div>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-500">
              {answeredCount} / {questions.length} cavablandı
            </span>
            <span className="font-mono text-blue-600 font-medium tabular-nums">
              {mins}:{secs}
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary py-2 px-5"
            >
              {submitting ? "Göndərilir..." : "Bitir"}
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-6xl mx-auto mt-2">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex gap-6 flex-1">
        {/* Question navigator sidebar */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <div className="card sticky top-24">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Suallar</h3>
            {lectureNums.map((lec) => {
              const qs = questions.filter((q) => q.lecture === lec);
              return (
                <div key={lec} className="mb-3">
                  <p className="text-xs text-gray-500 mb-1.5">
                    M{lec}: {LECTURE_NAMES[lec]}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {qs.map((q) => {
                      const globalIdx = questions.findIndex((x) => x.id === q.id);
                      const isAnswered = (answers[q.id]?.length ?? 0) > 0;
                      const isCurrent = globalIdx === current;
                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrent(globalIdx)}
                          className={`w-7 h-7 text-xs rounded font-medium transition-colors ${
                            isCurrent
                              ? "bg-blue-600 text-white"
                              : isAnswered
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {globalIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main question area */}
        <main className="flex-1 min-w-0">
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Mühazirə {question.lecture}: {LECTURE_NAMES[question.lecture]}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  question.difficulty === "easy"
                    ? "bg-green-50 text-green-700"
                    : question.difficulty === "medium"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-red-50 text-red-700"
                }`}>
                  {question.difficulty === "easy" ? "Asan" : question.difficulty === "medium" ? "Orta" : "Çətin"}
                </span>
                <span className="text-xs text-gray-400">{question.points} bal</span>
              </div>
            </div>

            <div
              className="flex items-baseline gap-2 mt-3 mb-5 select-none"
              onCopy={(e) => e.preventDefault()}
            >
              <span className="text-lg font-semibold text-gray-400 min-w-[2rem]">
                {current + 1}.
              </span>
              <h2 className="text-base font-medium text-gray-900 leading-relaxed">
                {question.text}
              </h2>
            </div>

            {question.type === "multiple" && (
              <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg mb-4 font-medium">
                Birdən çox cavab seçin
              </p>
            )}

            <div className="space-y-2.5 select-none" onCopy={(e) => e.preventDefault()}>
              {question.options.map((option, idx) => {
                const isSelected = answered.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleAnswer(idx)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 text-gray-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-${question.type === "single" ? "full" : "md"} border-2 flex items-center justify-center mt-0.5 transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300 bg-white"
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                          </svg>
                        )}
                      </span>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nav buttons */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="btn-secondary"
            >
              ← Əvvəlki
            </button>
            {current < questions.length - 1 ? (
              <button
                onClick={() => setCurrent((c) => c + 1)}
                className="btn-primary"
              >
                Növbəti →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary bg-green-600 hover:bg-green-700"
              >
                {submitting ? "Göndərilir..." : "İmtahanı Bitir ✓"}
              </button>
            )}
          </div>

          {submitError && (
            <p className="text-red-600 text-sm mt-3 text-center">{submitError}</p>
          )}

          {/* Mobile question grid */}
          <div className="lg:hidden mt-6 card">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">
              Sual naviqatoru ({answeredCount}/{questions.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {questions.map((q, idx) => {
                const isAnswered = (answers[q.id]?.length ?? 0) > 0;
                const isCurrent = idx === current;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrent(idx)}
                    className={`w-8 h-8 text-xs rounded font-medium transition-colors ${
                      isCurrent
                        ? "bg-blue-600 text-white"
                        : isAnswered
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
