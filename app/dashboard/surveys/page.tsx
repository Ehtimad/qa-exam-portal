"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FormQuestion {
  text: string;
  type: "single" | "multiple" | "open";
  options?: string[];
}

interface TeacherForm {
  id: string;
  title: string;
  description: string | null;
  questions: FormQuestion[];
  answered: boolean;
  createdAt: string;
}

function SurveyCard({ form, onAnswered }: { form: TeacherForm; onAnswered: () => void }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleOption(qi: number, opt: string, isMultiple: boolean) {
    if (isMultiple) {
      const cur = (answers[qi] as string[]) ?? [];
      const next = cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt];
      setAnswers({ ...answers, [qi]: next });
    } else {
      setAnswers({ ...answers, [qi]: opt });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/dashboard/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId: form.id, answers }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Xəta baş verdi"); }
    else { setOpen(false); onAnswered(); }
  }

  if (form.answered) {
    return (
      <div className="card opacity-60">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-700">{form.title}</h3>
            {form.description && <p className="text-sm text-gray-400 mt-0.5">{form.description}</p>}
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Cavablandı</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{form.title}</h3>
          {form.description && <p className="text-sm text-gray-500 mt-0.5">{form.description}</p>}
          <p className="text-xs text-gray-400 mt-1">{form.questions.length} sual</p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="btn-primary text-sm"
        >
          {open ? "Bağla" : "Cavabla"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          {form.questions.map((q, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-gray-800 mb-2">{i + 1}. {q.text}</p>
              {q.type === "open" ? (
                <textarea
                  value={(answers[i] as string) ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                  rows={2}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              ) : (
                <div className="space-y-1.5">
                  {(q.options ?? []).map((opt, oi) => {
                    const isMultiple = q.type === "multiple";
                    const cur = answers[i];
                    const checked = isMultiple
                      ? ((cur as string[]) ?? []).includes(opt)
                      : cur === opt;
                    return (
                      <label key={oi} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type={isMultiple ? "checkbox" : "radio"}
                          checked={checked}
                          onChange={() => toggleOption(i, opt, isMultiple)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Göndərilir..." : "Cavabları göndər"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Ləğv et
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function StudentSurveysPage() {
  const [forms, setForms] = useState<TeacherForm[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/dashboard/surveys")
      .then((r) => r.json())
      .then((d) => { setForms(d.forms ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(load, []);

  const pending   = forms.filter((f) => !f.answered);
  const completed = forms.filter((f) => f.answered);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm">← Dashboard</Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sorğular</h1>
        {completed.length > 0 && (
          <span className="text-sm text-gray-400">{completed.length} / {forms.length} tamamlandı</span>
        )}
      </div>

      {loading ? (
        <div className="card text-center py-10 text-gray-400">Yüklənir...</div>
      ) : forms.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">Hazırda aktiv sorğu yoxdur</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((f) => (
            <SurveyCard key={f.id} form={f} onAnswered={load} />
          ))}
          {completed.map((f) => (
            <SurveyCard key={f.id} form={f} onAnswered={load} />
          ))}
        </div>
      )}
    </div>
  );
}
