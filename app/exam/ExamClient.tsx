"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface DBQuestion {
  id: number;
  lectureId: number;
  text: string;
  type: string;
  options: string[];
  points: number;
}

interface SessionData {
  id: string;
  examId: string | null;
  questionOrder: number[];
  optionOrders: Record<string, number[]>;
  answers: Record<string, number[]>;
  tabSwitches: number;
}

interface Props {
  session: SessionData;
  questions: DBQuestion[];
  timeLimitMinutes: number | null;
}

export default function ExamClient({ session, questions, timeLimitMinutes }: Props) {
  const router = useRouter();
  const startTime = useRef(Date.now());
  const tabSwitches = useRef(session.tabSwitches);
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [answers, setAnswers] = useState<Record<string, number[]>>(session.answers);
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [tabWarn, setTabWarn] = useState(false);

  const questionOrder = session.questionOrder;
  const optionOrders = session.optionOrders;

  // Questions in shuffled order
  const orderedQuestions = questionOrder
    .map((id) => questions.find((q) => q.id === id))
    .filter(Boolean) as DBQuestion[];

  const question = orderedQuestions[current];
  const answeredCount = Object.keys(answers).filter((k) => (answers[k]?.length ?? 0) > 0).length;

  // Options in shuffled display order for current question
  const optionOrder = question ? (optionOrders[String(question.id)] ?? Array.from({ length: question.options.length }, (_, i) => i)) : [];
  const displayOptions = optionOrder.map((oi) => question?.options[oi] ?? "");

  // Answered display indices for current question (stored in display-space)
  const answered = answers[String(question?.id)] ?? [];

  function toggleAnswer(displayIdx: number) {
    if (!question) return;
    const qId = String(question.id);
    setAnswers((prev) => {
      const cur = prev[qId] ?? [];
      if (question.type === "single") return { ...prev, [qId]: [displayIdx] };
      if (cur.includes(displayIdx)) return { ...prev, [qId]: cur.filter((i) => i !== displayIdx) };
      return { ...prev, [qId]: [...cur, displayIdx] };
    });
  }

  // Auto-save every 30 seconds
  const doSave = useCallback(async (ans: Record<string, number[]>, sw: number) => {
    await fetch("/api/exam/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: ans, tabSwitches: sw }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    saveTimer.current = setInterval(() => doSave(answers, tabSwitches.current), 30_000);
    heartbeatTimer.current = setInterval(() => {
      fetch("/api/user/heartbeat", { method: "POST" }).catch(() => {});
    }, 60_000);
    return () => {
      if (saveTimer.current) clearInterval(saveTimer.current);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    };
  }, [doSave]);

  // Keep answers ref in sync for save
  useEffect(() => {
    // nothing — save is triggered by interval, answers state is captured via closure refresh
  }, [answers]);

  // Tab-switch detection
  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        tabSwitches.current += 1;
        setTabWarn(true);
        setTimeout(() => setTabWarn(false), 3000);
        doSave(answers, tabSwitches.current);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [answers, doSave]);

  // Timer (elapsed since page load, or countdown if time-limited)
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-submit when time limit reached
  useEffect(() => {
    if (!timeLimitMinutes) return;
    if (elapsed >= timeLimitMinutes * 60) {
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    if (saveTimer.current) clearInterval(saveTimer.current);

    const duration = Math.floor((Date.now() - startTime.current) / 1000);

    const res = await fetch("/api/exam/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, tabSwitches: tabSwitches.current, duration }),
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

  async function handleExit() {
    const hasAnswers = Object.values(answers).some((a) => a.length > 0);
    const msg = hasAnswers
      ? "İmtahandan çıxmaq istədiyinizə əminsiniz? Cavablarınız saxlanılacaq, sonra davam edə bilərsiniz."
      : "İmtahandan çıxmaq istədiyinizə əminsiniz? (Heç bir cavab verilmədiyindən cəhd sayılmayacaq)";

    if (!confirm(msg)) return;
    await doSave(answers, tabSwitches.current);
    await fetch("/api/exam/abandon", { method: "POST" }).catch(() => {});
    router.push("/dashboard");
  }

  // Time display
  let timeDisplay: string;
  let timeColor = "text-blue-600";
  if (timeLimitMinutes) {
    const remaining = Math.max(0, timeLimitMinutes * 60 - elapsed);
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    timeDisplay = `${m}:${s}`;
    if (remaining < 300) timeColor = "text-red-600 font-bold";
    else if (remaining < 600) timeColor = "text-amber-600";
  } else {
    const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const s = String(elapsed % 60).padStart(2, "0");
    timeDisplay = `${m}:${s}`;
  }

  if (!question) return <div className="p-8 text-center text-gray-500">Suallar yüklənir...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {tabWarn && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm font-medium">
          Tab dəyişdirildi! Cəhd qeyd edildi ({tabSwitches.current}×)
        </div>
      )}

      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="font-semibold text-gray-900">QA İmtahan</div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">{answeredCount}/{orderedQuestions.length} cavablandı</span>
            {timeLimitMinutes && (
              <span className="text-xs text-gray-400">Qalan vaxt:</span>
            )}
            <span className={`font-mono font-medium tabular-nums ${timeColor}`}>{timeDisplay}</span>
            {tabSwitches.current > 0 && (
              <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">
                Tab: {tabSwitches.current}×
              </span>
            )}
            <button onClick={handleExit} className="btn-secondary py-1.5 px-3 text-xs">Çıx</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary py-2 px-5">
              {submitting ? "Göndərilir..." : "Bitir"}
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-2">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(answeredCount / orderedQuestions.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex gap-6 flex-1">
        {/* Question navigator */}
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <div className="card sticky top-24">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Suallar</h3>
            <div className="flex flex-wrap gap-1">
              {orderedQuestions.map((q, idx) => {
                const isAnswered = (answers[String(q.id)]?.length ?? 0) > 0;
                const isCurrent = idx === current;
                return (
                  <button key={q.id} onClick={() => setCurrent(idx)}
                    className={`w-7 h-7 text-xs rounded font-medium transition-colors ${
                      isCurrent ? "bg-blue-600 text-white"
                        : isAnswered ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}>
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Sual {current + 1} / {orderedQuestions.length}
              </span>
              <span className="text-xs text-gray-400">{question.points} bal</span>
            </div>

            <div className="flex items-baseline gap-2 mt-3 mb-5 select-none" onCopy={(e) => e.preventDefault()}>
              <span className="text-lg font-semibold text-gray-400 min-w-[2rem]">{current + 1}.</span>
              <h2 className="text-base font-medium text-gray-900 leading-relaxed">{question.text}</h2>
            </div>

            {question.type === "multiple" && (
              <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg mb-4 font-medium">
                Birdən çox cavab seçin
              </p>
            )}

            <div className="space-y-2.5 select-none" onCopy={(e) => e.preventDefault()}>
              {displayOptions.map((option, displayIdx) => {
                const isSelected = answered.includes(displayIdx);
                return (
                  <button key={displayIdx} onClick={() => toggleAnswer(displayIdx)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 text-gray-800"
                    }`}>
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-${question.type === "single" ? "full" : "md"} border-2 flex items-center justify-center mt-0.5 transition-colors ${
                        isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300 bg-white"
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

          <div className="flex justify-between mt-4">
            <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="btn-secondary">
              ← Əvvəlki
            </button>
            {current < orderedQuestions.length - 1 ? (
              <button onClick={() => setCurrent((c) => c + 1)} className="btn-primary">Növbəti →</button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary bg-green-600 hover:bg-green-700">
                {submitting ? "Göndərilir..." : "İmtahanı Bitir ✓"}
              </button>
            )}
          </div>

          {submitError && <p className="text-red-600 text-sm mt-3 text-center">{submitError}</p>}

          <div className="lg:hidden mt-6 card">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">
              Sual naviqatoru ({answeredCount}/{orderedQuestions.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {orderedQuestions.map((q, idx) => {
                const isAnswered = (answers[String(q.id)]?.length ?? 0) > 0;
                const isCurrent = idx === current;
                return (
                  <button key={q.id} onClick={() => setCurrent(idx)}
                    className={`w-8 h-8 text-xs rounded font-medium transition-colors ${
                      isCurrent ? "bg-blue-600 text-white"
                        : isAnswered ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
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
