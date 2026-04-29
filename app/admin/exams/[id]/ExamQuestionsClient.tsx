"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  lectureId: number;
  text: string;
  type: string;
  difficulty: string;
  points: number;
  assigned: boolean;
}

const LECTURE_NAMES: Record<number, string> = {
  1: "Testing Əsasları", 2: "SDLC-də Test", 3: "Statik Test",
  4: "Test Analizi", 5: "Test İdarəetməsi", 6: "Test Alətləri", 7: "Yekun Mövzular",
};

export default function ExamQuestionsClient({
  examId, examTitle, allQuestions,
}: {
  examId: string;
  examTitle: string;
  allQuestions: Question[];
}) {
  const router = useRouter();
  const [assigned, setAssigned] = useState<Set<number>>(
    new Set(allQuestions.filter((q) => q.assigned).map((q) => q.id))
  );
  const [lecFilter, setLecFilter] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = allQuestions.filter((q) => {
    const matchLec = !lecFilter || q.lectureId === parseInt(lecFilter);
    const matchSearch = !search || q.text.toLowerCase().includes(search.toLowerCase());
    return matchLec && matchSearch;
  });

  function toggle(id: number) {
    setAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setAssigned(new Set(filtered.map((q) => q.id)));
  }

  function selectNone() {
    setAssigned((prev) => {
      const next = new Set(prev);
      filtered.forEach((q) => next.delete(q.id));
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/exams/${examId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionIds: Array.from(assigned) }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{examTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {assigned.size} sual seçilib / {allQuestions.length} sual
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Saxlanılır..." : "Dəyişiklikləri saxla"}
        </button>
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
        <button onClick={selectAll} className="btn-secondary text-sm">Hamısını seç</button>
        <button onClick={selectNone} className="btn-secondary text-sm">Hamısını ləğv et</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-3 py-3 w-10">
                  <input type="checkbox"
                    checked={filtered.length > 0 && filtered.every((q) => assigned.has(q.id))}
                    onChange={(e) => e.target.checked ? selectAll() : selectNone()}
                    className="rounded" />
                </th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium w-12">#</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Sual</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Mühazirə</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Tip</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Bal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id}
                  onClick={() => toggle(q.id)}
                  className={`border-b border-gray-50 cursor-pointer transition-colors ${assigned.has(q.id) ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={assigned.has(q.id)} onChange={() => toggle(q.id)}
                      onClick={(e) => e.stopPropagation()} className="rounded" />
                  </td>
                  <td className="px-3 py-3 text-gray-400">{q.id}</td>
                  <td className="px-3 py-3 text-gray-900 max-w-xs truncate">{q.text}</td>
                  <td className="px-3 py-3 text-gray-500">M{q.lectureId}: {LECTURE_NAMES[q.lectureId]}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.type === "single" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                      {q.type === "single" ? "Tək" : "Çoxlu"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{q.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Nəticə tapılmadı</p>}
        </div>
      </div>
    </>
  );
}
