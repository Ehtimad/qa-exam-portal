"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  text: string;
  type: string;
  options: string[];
  correctAnswers: number[];
  points: number;
  imageUrl?: string | null;
  explanation?: string | null;
}

interface ExamOption { id: string; name: string; assigned: boolean; }

interface FormState {
  text: string;
  type: "single" | "multiple";
  points: number;
  options: string[];
  correctAnswers: number[];
  imageUrl: string;
  explanation: string;
}

const EMPTY_FORM: FormState = {
  text: "", type: "single", points: 5,
  options: ["", "", "", ""], correctAnswers: [], imageUrl: "", explanation: "",
};

export default function QuestionsClient({ initialQuestions }: { initialQuestions: Question[] }) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [search, setSearch] = useState("");
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Exam assignment modal state
  const [examModalQ, setExamModalQ] = useState<Question | null>(null);
  const [examOptions, setExamOptions] = useState<ExamOption[]>([]);
  const [examSaving, setExamSaving] = useState(false);
  const [examLoading, setExamLoading] = useState(false);

  // Pagination
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = questions.filter((q) =>
    !search || q.text.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function openEdit(q: Question) {
    setEditQ(q);
    setForm({
      text: q.text,
      type: q.type as "single" | "multiple",
      points: q.points,
      options: [...q.options, "", "", "", ""].slice(0, Math.max(4, q.options.length)),
      correctAnswers: [...q.correctAnswers],
      imageUrl: q.imageUrl ?? "",
      explanation: q.explanation ?? "",
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
    // Send required API fields with defaults for hidden fields
    const payload = {
      ...form,
      options: opts,
      imageUrl: form.imageUrl || null,
      explanation: form.explanation || null,
      lectureId: editQ ? (initialQuestions.find((q) => q.id === editQ.id) as unknown as { lectureId?: number })?.lectureId ?? 1 : 1,
      difficulty: "medium" as const,
    };

    const url = editQ ? `/api/admin/questions/${editQ.id}` : "/api/admin/questions";
    const method = editQ ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
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
      const msgs = [`${data.imported ?? 0} yeni sual əlavə edildi`, data.updated ? `${data.updated} sual yeniləndi` : ""].filter(Boolean);
      const errMsg = data.errors?.length ? `\n\nXətalar (${data.errors.length}):\n${data.errors.slice(0, 5).join("\n")}${data.errors.length > 5 ? `\n...+${data.errors.length - 5} daha` : ""}` : "";
      alert(msgs.join(", ") + errMsg);
      router.refresh();
    } else {
      alert("İdxal xətası");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function openExamModal(q: Question) {
    setExamModalQ(q);
    setExamOptions([]);
    setExamLoading(true);
    const res = await fetch(`/api/admin/questions/${q.id}/exams`);
    if (res.ok) setExamOptions(await res.json());
    setExamLoading(false);
  }

  async function saveExamAssignments() {
    if (!examModalQ) return;
    setExamSaving(true);
    const examIds: string[] = examOptions.filter((e) => e.assigned).map((e) => e.id);
    await fetch(`/api/admin/questions/${examModalQ.id}/exams`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examIds }),
    });
    setExamSaving(false);
    setExamModalQ(null);
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
          <a href="/api/admin/questions/template" download className="btn-secondary text-sm">CSV Şablon</a>
          <label className="btn-secondary text-sm cursor-pointer">
            {importing ? "İdxal olunur..." : "CSV İdxal"}
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={openAdd} className="btn-primary text-sm">+ Sual Əlavə Et</button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input type="text" placeholder="Sual axtar..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-sm" />
        <span className="text-sm text-gray-500">{filtered.length} nəticə</span>
        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none">
          {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / səhifə</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-3 py-3 text-gray-500 font-medium w-12">#</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Sual</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Tip</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Bal</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">İmtahanlar</th>
                <th className="text-right px-3 py-3 text-gray-500 font-medium">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((q) => (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-3 text-gray-400">{q.id}</td>
                  <td className="px-3 py-3 text-gray-900 max-w-xs truncate">{q.text}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.type === "single" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                      {q.type === "single" ? "Tək" : "Çoxlu"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{q.points}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => openExamModal(q)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 border border-indigo-200">
                      İmtahan Əlavə Et
                    </button>
                  </td>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} / {filtered.length}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">← Əvvəl</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                  const p = start + i;
                  return p <= totalPages ? (
                    <button key={p} onClick={() => setCurrentPage(p)}
                      className={`px-2.5 py-1 text-xs rounded border ${p === currentPage ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"}`}>
                      {p}
                    </button>
                  ) : null;
                })}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Sonra →</button>
              </div>
            </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "single" | "multiple", correctAnswers: [] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="single">Tək cavab</option>
                    <option value="multiple">Çoxlu cavab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bal</label>
                  <input type="number" min={1} value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 1 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sual mətni</label>
                <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İzahat <span className="text-gray-400 font-normal">(imtahan bitdikdən sonra tələbəyə göstərilir — istəyə görə)</span>
                </label>
                <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} rows={2}
                  placeholder="Niyə bu cavab düzgündür?..."
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

      {/* Exam assignment modal */}
      {examModalQ && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">İmtahana Əlavə Et</h2>
            <p className="text-xs text-gray-500 mb-4 truncate">Sual #{examModalQ.id}: {examModalQ.text.slice(0, 50)}...</p>

            {examLoading ? (
              <p className="text-gray-400 text-sm py-4 text-center">Yüklənir...</p>
            ) : examOptions.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">İmtahan tapılmadı. Əvvəlcə imtahan yaradın.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {examOptions.map((e) => (
                  <label key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={e.assigned}
                      onChange={(ev) => setExamOptions((prev) =>
                        prev.map((x) => x.id === e.id ? { ...x, assigned: ev.target.checked } : x)
                      )}
                      className="w-4 h-4 rounded accent-blue-600" />
                    <span className="text-sm text-gray-800">{e.name}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={saveExamAssignments} disabled={examSaving || examLoading || examOptions.length === 0}
                className="btn-primary flex-1">
                {examSaving ? "Saxlanılır..." : "Saxla"}
              </button>
              <button onClick={() => setExamModalQ(null)} className="btn-secondary flex-1">Ləğv et</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
