"use client";

import { useEffect, useState } from "react";

interface NotifRow {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
}

interface Group { id: string; name: string; }
interface User  { id: string; name: string | null; email: string; }

export default function NotificationsAdminClient() {
  const [sent, setSent] = useState<NotifRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [type, setType] = useState<"all" | "group" | "individual">("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [nRes, gRes, uRes] = await Promise.all([
      fetch("/api/admin/notifications"),
      fetch("/api/groups"),
      fetch("/api/admin/users"),
    ]);
    if (nRes.ok) setSent(await nRes.json());
    if (gRes.ok) setGroups(await gRes.json());
    if (uRes.ok) {
      const data = await uRes.json();
      setUsers(data.users ?? data ?? []);
    }
  }

  useEffect(() => { load(); }, []);

  async function send() {
    setError(""); setSuccess("");
    if (!title || !message) { setError("Başlıq və mətn tələb olunur"); return; }
    if (type === "group" && !groupId) { setError("Qrup seçin"); return; }
    if (type === "individual" && !userId) { setError("İstifadəçi seçin"); return; }
    setLoading(true);
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, type, groupId: groupId || undefined, userId: userId || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess("Bildiriş göndərildi!");
      setTitle(""); setMessage(""); setGroupId(""); setUserId("");
      load();
    } else {
      const d = await res.json();
      setError(d.error ?? "Xəta baş verdi");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bildiriş Göndər</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hədəf</label>
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Hamıya</option>
              <option value="group">Qrupa</option>
              <option value="individual">Fərdi istifadəçiyə</option>
            </select>
          </div>

          {type === "group" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qrup</label>
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Qrup seçin —</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}

          {type === "individual" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İstifadəçi</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— İstifadəçi seçin —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlıq</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mətn</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button onClick={send} disabled={loading} className="btn-primary">
            {loading ? "Göndərilir..." : "Göndər"}
          </button>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">Son bildirişlər</h2>
      <div className="space-y-2">
        {sent.length === 0 && <p className="text-gray-400 text-sm">Bildiriş yoxdur</p>}
        {sent.map((n) => (
          <div key={n.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">
                {n.type === "all" ? "Hamıya" : n.type === "group" ? "Qrupa" : "Fərdi"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString("az-AZ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
