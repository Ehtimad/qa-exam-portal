"use client";

import { useEffect, useState } from "react";

interface Material {
  id: string;
  title: string;
  contentUrl: string;
  groupId: string | null;
  startDate: string;
  endDate: string | null;
}

interface Group { id: string; name: string; }

const empty = { title: "", contentUrl: "", groupId: "", startDate: "", endDate: "" };

export default function MaterialsClient() {
  const [items, setItems] = useState<Material[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [mRes, gRes] = await Promise.all([
      fetch("/api/admin/materials"),
      fetch("/api/groups"),
    ]);
    if (mRes.ok) setItems(await mRes.json());
    if (gRes.ok) setGroups(await gRes.json());
  }

  useEffect(() => { load(); }, []);

  function startEdit(m: Material) {
    setEditing(m.id);
    setForm({
      title: m.title,
      contentUrl: m.contentUrl,
      groupId: m.groupId ?? "",
      startDate: m.startDate.slice(0, 16),
      endDate: m.endDate ? m.endDate.slice(0, 16) : "",
    });
  }

  function cancelEdit() { setEditing(null); setForm(empty); setError(""); }

  async function save() {
    setError("");
    if (!form.title || !form.contentUrl) { setError("Ad və URL tələb olunur"); return; }
    setLoading(true);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/materials/${editing}` : "/api/admin/materials";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        contentUrl: form.contentUrl,
        groupId: form.groupId || null,
        startDate: form.startDate || undefined,
        endDate: form.endDate || null,
      }),
    });
    setLoading(false);
    if (res.ok) { cancelEdit(); load(); }
    else { const d = await res.json(); setError(d.error ?? "Xəta"); }
  }

  async function del(id: string) {
    if (!confirm("Silmək istədiyinizə əminsiniz?")) return;
    await fetch(`/api/admin/materials/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Materiallar</h1>
        {!editing && (
          <button onClick={() => setEditing("")}
            className="btn-primary text-sm">
            + Yeni material
          </button>
        )}
      </div>

      {(editing !== null) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            {editing ? "Materialı redaktə et" : "Yeni material"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlıq</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input value={form.contentUrl} onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
                placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qrup <span className="text-gray-400">(boş = hamı)</span></label>
              <select value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Bütün qruplar —</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlanğıc tarixi</label>
              <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bitmə tarixi <span className="text-gray-400">(boş = limitsiz)</span></label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={loading} className="btn-primary">{loading ? "Saxlanılır..." : "Saxla"}</button>
            <button onClick={cancelEdit} className="btn-secondary">Ləğv et</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Material yoxdur</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Başlıq</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Qrup</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tarix</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <a href={m.contentUrl} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium">{m.title}</a>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {m.groupId ? (groups.find((g) => g.id === m.groupId)?.name ?? m.groupId) : "Hamı"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(m.startDate).toLocaleDateString("az-AZ")}
                    {m.endDate && ` – ${new Date(m.endDate).toLocaleDateString("az-AZ")}`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(m)} className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 mr-1">Redaktə</button>
                    <button onClick={() => del(m.id)} className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50">Sil</button>
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
