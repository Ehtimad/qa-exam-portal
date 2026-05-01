"use client";

import { useEffect, useState } from "react";
import { ROLE_LABELS } from "@/lib/rbac";

interface Ad {
  id: string;
  title: string;
  content: string;
  targetRole: string;
  isActive: boolean;
  createdAt: string;
}

const empty = { title: "", content: "", targetRole: "all", isActive: true };
const TARGET_ROLES = ["all", "student", "admin", "manager", "reporter", "worker", "teacher"];

export default function AdsClient() {
  const [items, setItems] = useState<Ad[]>([]);
  const [form, setForm] = useState<typeof empty & { isActive: boolean }>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/advertisements");
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => { load(); }, []);

  function startEdit(a: Ad) {
    setEditing(a.id);
    setForm({ title: a.title, content: a.content, targetRole: a.targetRole, isActive: a.isActive });
  }

  function cancelEdit() { setEditing(null); setForm(empty); setError(""); }

  async function save() {
    setError("");
    if (!form.title || !form.content) { setError("Başlıq və mətn tələb olunur"); return; }
    setLoading(true);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/advertisements/${editing}` : "/api/admin/advertisements";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) { cancelEdit(); load(); }
    else { const d = await res.json(); setError(d.error ?? "Xəta"); }
  }

  async function del(id: string) {
    if (!confirm("Silmək istədiyinizə əminsiniz?")) return;
    await fetch(`/api/admin/advertisements/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleActive(ad: Ad) {
    await fetch(`/api/admin/advertisements/${ad.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ad, isActive: !ad.isActive }),
    });
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reklamlar / Elanlar</h1>
        {editing === null && (
          <button onClick={() => setEditing("")} className="btn-primary text-sm">+ Yeni elan</button>
        )}
      </div>

      {editing !== null && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            {editing ? "Elanı redaktə et" : "Yeni elan"}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlıq</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mətn</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hədəf rol</label>
                <select value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {TARGET_ROLES.map((r) => (
                    <option key={r} value={r}>{r === "all" ? "Hamı" : (ROLE_LABELS[r] ?? r)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">Aktiv</span>
                </label>
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={loading} className="btn-primary">{loading ? "Saxlanılır..." : "Saxla"}</button>
            <button onClick={cancelEdit} className="btn-secondary">Ləğv et</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Elan yoxdur</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Başlıq</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Hədəf</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.content}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {a.targetRole === "all" ? "Hamı" : (ROLE_LABELS[a.targetRole] ?? a.targetRole)}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(a)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        a.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                      {a.isActive ? "Aktiv" : "Deaktiv"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(a)} className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 mr-1">Redaktə</button>
                    <button onClick={() => del(a.id)} className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
