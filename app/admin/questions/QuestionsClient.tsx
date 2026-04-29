"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  lectureId: number;
  text: string;
  type: string;
  options: string[];
  correctAnswers: number[];
  difficulty: string;
  points: number;
  imageUrl?: string | null;
}

const LECTURE_NAMES: Record<number, string> = {
  1: "Testing Əsasları", 2: "SDLC-də Test", 3: "Statik Test",
  4: "Test Analizi", 5: "Test İdarəetməsi", 6: "Test Alətləri", 7: "Yekun Mövzular",
};

interface FormState {
  lectureId: number;
  text: string;
  type: "single" | "multiple";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  options: string[];
  correctAnswers: number[];
  imageUrl: string;
}

const EMPTY_FORM: FormState = {
  lectureId: 1, text: "", type: "single", difficulty: "medium",
  points: 5, options: ["", "", "", ""], correctAnswers: [], imageUrl: "",
};

export default function QuestionsClient({ initialQuestions }: { initialQuestions: Question[] }) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [search, setSearch] = useState("");
  const [lecFilter, setLecFilter] = useState("");
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = questions.filter((q) => {
    const matchSearch = !search || q.text.toLowerCase().includes(search.toLowerCase());
    const matchLec = !lecFilter || q.lectureId === parseInt(lecFilter);
    return matchSearch && matchLec;
  });

  function openEdit(q: Question) {
    setEditQ(q);
    setForm({
      lectureId: q.lectureId,
      text: q.text,
      type: q.type as "single" | "multiple",
      difficulty: q.difficulty as "easy" | "medium" | "hard",
      points: q.points,
      options: [...q.options, "", "", "", ""].slice(0, Math.max(4, q.options.length)),
      correctAnswers: [...q.correctAnswers],
      imageUrl: q.imageUrl ?? "",
    });
    setError("");
  }

  function openAdd() {
    setEditQ(null);
    setForm(EMPTY_FORM);
    setShowAdd(true);
    setError("");
  }

  function toggleCorrect(idx: number) {
    setForm((prev) => {
      const has = prev.correctAnswers.includes(idx);
      if (prev.type === "single") return { ...prev, correctAnswers: has ? [] : [idx] };
      return { ...prev, correctAnswers: has ? prev.correctAnswers.filter((i) => i !== idx) : [...prev.correctAnswers, idx] };
    });
  }

  async function handleSave() {
    const opts = form.options.filter((o) => o.trim());
    if (opts.length < 2) { setError("Ən az 2 variant daxil edin"); return; }
    if (form.correctAnswers.length === 0) { setError("Ən az 1 düzgün cavab seçin"); return; }
    if (!form.text.trim()) { setError("Sual mətni daxil edin"); return; }

    setSaving(true);
    setError("");
    const payload = { ...form, options: opts, imageUrl: form.imageUrl || null };

    const url = editQ ? `/api/admin/questions/${editQ.id}` : "/api/admin/questions";
    const method = editQ ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (res.ok) {
      const updated = await res.json();
      if (editQ) {
        setQuestions((prev) => prev.map((q) => q.id === updated.id ? updated : q));
      } else {
        setQuestions((prev) => [...prev, updated]);
      }
      setEditQ(null);
      setShowAdd(false);
    } else {
      const d = await res.json();
      setError(d.error ?? "Xəta baş verdi");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Bu sualı silmək istədiyinizə əminsiniz?")) return;
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/questions/import", { method: "POST", body: fd });
    const data = await res.json();
    setImporting(false);
    if (res.ok) {
      alert(`${data.imported} sual idxal edildi${data.errors?.length ? `. Xətalar: ${data.errors.join("; ")}` : ""}`);
      router.refresh();
    } else {
      alert("İdxal xətası");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const showForm = showAdd || editQ !== null;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sual Bazası</h1>
          <p className="text-sm text-gray-500 mt-1">{questions.length} sual</p>
        </div>
        <div className="flex gap-2">
          <label className="btn-secondary text-sm cursor-pointer">
            {importing ? "İdxal olunur..." : "CSV İdxal"}
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={openAdd} className="btn-primary text-sm">+ Sual Əlavə Et</button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Sual axtar..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-sm" />
        <select value={lecFilter} onChange={(e) => setLecFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Bütün mühazirələr</option>
          {Object.entries(LECTURE_NAMES).map(([k, v]) => (
            <option key={k} value={k}>M{k}: {v}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-3 py-3 text-gray-500 font-medium w-12">#</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Sual</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Mühazirə</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Tip</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Çətinlik</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Bal</th>
                <th className="text-right px-3 py-3 text-gray-500 font-medium">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-3 text-gray-400">{q.id}</td>
                  <td className="px-3 py-3 text-gray-900 max-w-xs truncate">{q.text}</td>
                  <td className="px-3 py-3 text-gray-500">M{q.lectureId}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.type === "single" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                      {q.type === "single" ? "Tək" : "Çoxlu"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      q.difficulty === "easy" ? "bg-green-50 text-green-700" :
                      q.difficulty === "medium" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                    }`}>
                      {q.difficulty === "easy" ? "Asan" : q.difficulty === "medium" ? "Orta" : "Çətin"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{q.points}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(q)} className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50">Redaktə</button>
                      <button onClick={() => handleDelete(q.id)} className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50">Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Nəticə tapılmadı</p>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 my-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editQ ? `Sual #${editQ.id} redaktə et` : "Yeni sual əlavə et"}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mühazirə</label>
                  <select value={form.lectureId} onChange={(e) => setForm({ ...form, lectureId: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(LECTURE_NAMES).map(([k, v]) => (
                      <option key={k} value={k}>M{k}: {v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "single" | "multiple", correctAnswers: [] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="single">Tək cavab</option>
                    <option value="multiple">Çoxlu cavab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Çətinlik</label>
                  <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as "easy" | "medium" | "hard" })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="easy">Asan (3 bal)</option>
                    <option value="medium">Orta (5 bal)</option>
                    <option value="hard">Çətin (8 bal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bal</label>
                <input type="number" min={1} value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 1 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sual mətni</label>
                <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cavab variantları <span className="text-gray-400 font-normal">(düzgün cavab(lar)ı işarələyin)</span>
                </label>
                <div className="space-y-2">
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button type="button" onClick={() => toggleCorrect(idx)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          form.correctAnswers.includes(idx) ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"
                        }`}>
                        {form.correctAnswers.includes(idx) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                          </svg>
                        )}
                      </button>
                      <input type="text" value={opt} onChange={(e) => {
                        const newOpts = [...form.options];
                        newOpts[idx] = e.target.value;
                        setForm({ ...form, options: newOpts });
                      }} placeholder={`Variant ${idx + 1}`}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  ))}
                </div>
                {form.options.length < 8 && (
                  <button type="button" onClick={() => setForm({ ...form, options: [...form.options, ""] })}
                    className="text-xs text-blue-600 hover:underline mt-2">+ Variant əlavə et</button>
                )}
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? "Saxlanılır..." : "Saxla"}
              </button>
              <button onClick={() => { setEditQ(null); setShowAdd(false); }} className="btn-secondary flex-1">Ləğv et</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
