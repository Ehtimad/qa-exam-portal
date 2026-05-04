"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FormQuestion {
  text: string;
  type: "single" | "multiple" | "open";
  options?: string[];
}

interface TeacherForm {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  questions: FormQuestion[];
  answerCount: number;
  createdAt: string;
}

function QuestionEditor({
  q, index, onChange, onRemove,
}: {
  q: FormQuestion; index: number;
  onChange: (q: FormQuestion) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Sual {index + 1}</span>
        <button onClick={onRemove} className="text-xs text-red-500 hover:text-red-700">Sil</button>
      </div>
      <input
        type="text"
        value={q.text}
        onChange={(e) => onChange({ ...q, text: e.target.value })}
        placeholder="Sual mətni..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={q.type}
        onChange={(e) => onChange({ ...q, type: e.target.value as FormQuestion["type"], options: e.target.value === "open" ? undefined : (q.options ?? ["", ""]) })}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
      >
        <option value="open">Açıq cavab</option>
        <option value="single">Tək seçim</option>
        <option value="multiple">Çoxlu seçim</option>
      </select>

      {q.type !== "open" && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Variantlar:</p>
          {(q.options ?? []).map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const opts = [...(q.options ?? [])];
                  opts[i] = e.target.value;
                  onChange({ ...q, options: opts });
                }}
                placeholder={`Variant ${i + 1}`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {(q.options ?? []).length > 2 && (
                <button
                  onClick={() => {
                    const opts = [...(q.options ?? [])];
                    opts.splice(i, 1);
                    onChange({ ...q, options: opts });
                  }}
                  className="text-gray-400 hover:text-red-500 text-sm px-1"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => onChange({ ...q, options: [...(q.options ?? []), ""] })}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            + Variant əlavə et
          </button>
        </div>
      )}
    </div>
  );
}

function CreateFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<FormQuestion[]>([
    { text: "", type: "open" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addQuestion() {
    setQuestions([...questions, { text: "", type: "open" }]);
  }

  async function handleSave() {
    if (!title.trim()) { setError("Başlıq tələb olunur"); return; }
    const valid = questions.every((q) => q.text.trim());
    if (!valid) { setError("Bütün sual mətnlərini doldurun"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/teacher-forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, questions }),
    });
    setLoading(false);
    if (res.ok) { onSaved(); onClose(); }
    else {
      const d = await res.json();
      setError(d.error ?? "Xəta baş verdi");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl my-4">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Yeni Sorğu Yarat</h2>

          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Sorğu başlığı..." required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={2} placeholder="Açıqlama (istəyə görə)..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Suallar</p>
            {questions.map((q, i) => (
              <QuestionEditor
                key={i} q={q} index={i}
                onChange={(nq) => { const qs = [...questions]; qs[i] = nq; setQuestions(qs); }}
                onRemove={() => { if (questions.length > 1) setQuestions(questions.filter((_, j) => j !== i)); }}
              />
            ))}
            <button onClick={addQuestion}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              + Sual əlavə et
            </button>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={handleSave} disabled={loading} className="btn-primary flex-1">
            {loading ? "Saxlanılır..." : "Yarat"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">Ləğv et</button>
        </div>
      </div>
    </div>
  );
}

function AnswersModal({ form, onClose }: { form: TeacherForm; onClose: () => void }) {
  const [answers, setAnswers] = useState<{ student: { name: string | null; email: string }; answers: Record<string, string | string[]>; submittedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/teacher-forms/${form.id}`)
      .then((r) => r.json())
      .then((d) => { setAnswers(d.answers ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [form.id]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{form.title} — Cavablar</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
          </div>

          {loading ? (
            <p className="text-gray-400 text-center py-8">Yüklənir...</p>
          ) : answers.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Hələ cavab yoxdur</p>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {answers.map((a, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900 text-sm">{a.student.name ?? a.student.email}</span>
                    <span className="text-xs text-gray-400">{new Date(a.submittedAt).toLocaleDateString("az-AZ")}</span>
                  </div>
                  {form.questions.map((q, qi) => (
                    <div key={qi} className="mb-2">
                      <p className="text-xs font-medium text-gray-600">{q.text}</p>
                      <p className="text-sm text-gray-800 mt-0.5">
                        {Array.isArray(a.answers[qi]) ? (a.answers[qi] as string[]).join(", ") : String(a.answers[qi] ?? "—")}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeacherFormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<TeacherForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewAnswers, setViewAnswers] = useState<TeacherForm | null>(null);

  function load() {
    fetch("/api/admin/teacher-forms")
      .then((r) => r.json())
      .then((d) => { setForms(d.forms ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/teacher-forms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  async function deleteForm(id: string) {
    if (!confirm("Bu sorğunu silmək istədiyinizə əminsiniz?")) return;
    await fetch(`/api/admin/teacher-forms/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {showCreate && <CreateFormModal onClose={() => setShowCreate(false)} onSaved={load} />}
      {viewAnswers && <AnswersModal form={viewAnswers} onClose={() => setViewAnswers(null)} />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sorğular</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + Yeni Sorğu
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-10 text-gray-400">Yüklənir...</div>
      ) : forms.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-400">Hələ sorğu yoxdur</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">İlk Sorğunu Yarat</button>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((f) => (
            <div key={f.id} className="card flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-gray-900">{f.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    f.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {f.isActive ? "Aktiv" : "Deaktiv"}
                  </span>
                </div>
                {f.description && <p className="text-sm text-gray-500 mt-0.5">{f.description}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {f.questions.length} sual · {f.answerCount} cavab
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setViewAnswers(f)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                >
                  Cavablar
                </button>
                <button
                  onClick={() => toggleActive(f.id, f.isActive)}
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    f.isActive
                      ? "text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                      : "text-green-600 hover:text-green-800 hover:bg-green-50"
                  }`}
                >
                  {f.isActive ? "Deaktiv et" : "Aktivləşdir"}
                </button>
                <button
                  onClick={() => deleteForm(f.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
