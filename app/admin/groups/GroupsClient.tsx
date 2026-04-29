"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Group {
  id: string;
  name: string;
  createdAt: Date | string;
  studentCount: number;
}

export default function GroupsClient({ initialGroups }: { initialGroups: Group[] }) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setError("");
    const res = await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setAdding(false);
    if (res.ok) {
      const g = await res.json();
      setGroups((prev) => [...prev, { ...g, studentCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    } else {
      const d = await res.json();
      setError(d.error ?? "Xəta baş verdi");
    }
  }

  async function handleRename(id: string) {
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    if (res.ok) {
      setGroups((prev) => prev.map((g) => g.id === id ? { ...g, name } : g).sort((a, b) => a.name.localeCompare(b.name)));
      setEditId(null);
      setEditName("");
    } else {
      const d = await res.json();
      setError(d.error ?? "Xəta baş verdi");
    }
  }

  async function handleDelete(id: string, name: string, studentCount: number) {
    if (studentCount > 0) {
      if (!confirm(`"${name}" qrupunda ${studentCount} tələbə var. Silsəniz, tələbələrin qrupu boş qalacaq. Davam etmək istəyirsiniz?`)) return;
    } else {
      if (!confirm(`"${name}" qrupunu silmək istədiyinizə əminsiniz?`)) return;
    }
    await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
    setGroups((prev) => prev.filter((g) => g.id !== id));
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Qruplar</h1>
          <p className="text-sm text-gray-500 mt-1">{groups.length} qrup</p>
        </div>
      </div>

      {/* Add new group */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Yeni qrup əlavə et</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Məs: March Group 2025"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="btn-primary text-sm px-5"
          >
            {adding ? "Əlavə edilir..." : "Əlavə et"}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      {/* Groups list */}
      <div className="card overflow-hidden">
        {groups.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">Hələ heç bir qrup yoxdur</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Qrup adı</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tələbə sayı</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Yaradılma tarixi</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {editId === g.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(g.id);
                          if (e.key === "Escape") { setEditId(null); setEditName(""); }
                        }}
                        autoFocus
                        className="border border-blue-400 rounded px-2 py-1 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{g.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {g.studentCount} tələbə
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(g.createdAt).toLocaleDateString("az-AZ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editId === g.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRename(g.id)}
                          disabled={saving}
                          className="text-xs text-green-700 hover:text-green-900 font-medium px-2 py-1 rounded hover:bg-green-50"
                        >
                          {saving ? "..." : "Saxla"}
                        </button>
                        <button
                          onClick={() => { setEditId(null); setEditName(""); }}
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-100"
                        >
                          Ləğv et
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditId(g.id); setEditName(g.name); setError(""); }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Adını dəyiş
                        </button>
                        <button
                          onClick={() => handleDelete(g.id, g.name, g.studentCount)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50"
                        >
                          Sil
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
