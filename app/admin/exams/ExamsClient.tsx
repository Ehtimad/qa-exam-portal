"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Group { id: string; name: string; }

interface Exam {
  id: string;
  title: string;
  groupId: string | null;
  groupName: string | null;
  timeLimitMinutes: number | null;
  isActive: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questionCount: number;
  createdAt: Date | string;
}

const EMPTY_FORM = {
  title: "", groupId: "", timeLimitMinutes: "" as string | number, isActive: false,
  shuffleQuestions: true, shuffleOptions: true,
};

export default function ExamsClient({ initialExams, groups }: { initialExams: Exam[]; groups: Group[] }) {
  const router = useRouter();
  const [exams, setExams] = useState(initialExams);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function openEdit(e: Exam) {
    setEditExam(e);
    setForm({
      title: e.title,
      groupId: e.groupId ?? "",
      timeLimitMinutes: e.timeLimitMinutes ?? "",
      isActive: e.isActive,
      shuffleQuestions: e.shuffleQuestions,
      shuffleOptions: e.shuffleOptions,
    });
    setError("");
  }

  function openAdd() {
    setEditExam(null);
    setForm(EMPTY_FORM);
    setShowAdd(true);
    setError("");
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Başlıq daxil edin"); return; }
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      groupId: form.groupId || null,
      timeLimitMinutes: form.timeLimitMinutes ? parseInt(String(form.timeLimitMinutes)) : null,
    };

    const url = editExam ? `/api/admin/exams/${editExam.id}` : "/api/admin/exams";
    const method = editExam ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);

    if (res.ok) {
      router.refresh();
      setEditExam(null);
      setShowAdd(false);
    } else {
      const d = await res.json();
      setError(d.error ?? "Xəta baş verdi");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu imtahanı silmək istədiyinizə əminsiniz?")) return;
    await fetch(`/api/admin/exams/${id}`, { method: "DELETE" });
    setExams((prev) => prev.filter((e) => e.id !== id));
  }

  async function toggleActive(exam: Exam) {
    setTogglingId(exam.id);
    await fetch(`/api/admin/exams/${exam.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !exam.isActive }),
    });
    setExams((prev) => prev.map((e) => e.id === exam.id ? { ...e, isActive: !e.isActive } : e));
    setTogglingId(null);
  }

  const showForm = showAdd || editExam !== null;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İmtahanlar</h1>
          <p className="text-sm text-gray-500 mt-1">{exams.length} imtahan</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm">+ İmtahan Əlavə Et</button>
      </div>

      <div className="card overflow-hidden">
        {exams.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">Hələ heç bir imtahan yoxdur</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-3 py-3 text-gray-500 font-medium">Başlıq</th>
                  <th className="text-left px-3 py-3 text-gray-500 font-medium">Qrup</th>
                  <th className="text-left px-3 py-3 text-gray-500 font-medium">Vaxt</th>
                  <th className="text-left px-3 py-3 text-gray-500 font-medium">Suallar</th>
                  <th className="text-left px-3 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-right px-3 py-3 text-gray-500 font-medium">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-3 font-medium text-gray-900">{e.title}</td>
                    <td className="px-3 py-3 text-gray-500">{e.groupName ?? "Bütün qruplar"}</td>
                    <td className="px-3 py-3 text-gray-500">
                      {e.timeLimitMinutes ? `${e.timeLimitMinutes} dəq` : "Limitsiz"}
                    </td>
                    <td className="px-3 py-3 text-gray-500">{e.questionCount} sual</td>
                    <td className="px-3 py-3">
                      <button onClick={() => toggleActive(e)} disabled={togglingId === e.id}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          e.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}>
                        {togglingId === e.id ? "..." : e.isActive ? "Aktiv" : "Deaktiv"}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/exams/${e.id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50">
                          Suallar
                        </Link>
                        <button onClick={() => openEdit(e)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50">
                          Redaktə
                        </button>
                        <button onClick={() => handleDelete(e.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50">
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editExam ? "İmtahanı redaktə et" : "Yeni imtahan"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlıq</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qrup <span className="text-gray-400">(boş = hamıya)</span></label>
                <select value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">— Bütün qruplar —</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vaxt limiti (dəqiqə, boş = limitsiz)</label>
                <input type="number" min={1} value={form.timeLimitMinutes}
                  onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded" />
                  Aktiv
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.shuffleQuestions} onChange={(e) => setForm({ ...form, shuffleQuestions: e.target.checked })}
                    className="rounded" />
                  Sualları qarışdır
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.shuffleOptions} onChange={(e) => setForm({ ...form, shuffleOptions: e.target.checked })}
                    className="rounded" />
                  Variantları qarışdır
                </label>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? "Saxlanılır..." : "Saxla"}
              </button>
              <button onClick={() => { setEditExam(null); setShowAdd(false); }} className="btn-secondary flex-1">Ləğv et</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
