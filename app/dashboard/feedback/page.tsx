"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Teacher { id: string; name: string; email: string; }
interface FeedbackRow {
  id: string;
  rating: number;
  comment: string | null;
  type: string;
  createdAt: string;
  fromUser: { id: string; name: string | null; email: string };
  toUser:   { id: string; name: string | null; email: string };
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`text-2xl transition-colors ${
            i <= (hover || value) ? "text-yellow-400" : "text-gray-200"
          } ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export default function StudentFeedbackPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [received, setReceived] = useState<FeedbackRow[]>([]);
  const [given, setGiven] = useState<FeedbackRow[]>([]);
  const [form, setForm] = useState({ toUserId: "", rating: 0, comment: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState<"give" | "received" | "given">("give");

  useEffect(() => {
    fetch("/api/teachers").then((r) => r.json()).then(setTeachers).catch(() => {});
    fetch("/api/admin/feedbacks?mode=received").then((r) => r.json()).then((d) => setReceived(d.feedbacks ?? [])).catch(() => {});
    fetch("/api/admin/feedbacks?mode=given").then((r) => r.json()).then((d) => setGiven(d.feedbacks ?? [])).catch(() => {});
  }, [success]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.toUserId) { setError("Müəllim seçin"); return; }
    if (form.rating === 0) { setError("Qiymət verin (1-5 ulduz)"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/feedbacks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: form.toUserId, rating: form.rating, comment: form.comment }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Xəta baş verdi"); }
    else {
      setSuccess("Rəyiniz göndərildi!");
      setForm({ toUserId: "", rating: 0, comment: "" });
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm">← Dashboard</Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Rəylər</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["give", "received", "given"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "give" ? "Rəy ver" : t === "received" ? "Gələnlər" : "Göndərilənlər"}
          </button>
        ))}
      </div>

      {tab === "give" && (
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Müəlliminə rəy ver</h2>
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Müəllim</label>
              <select value={form.toUserId} onChange={(e) => setForm({ ...form, toUserId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Müəllim seçin —</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Qiymət</label>
              <Stars value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şərh <span className="text-gray-400 font-normal">(istəyə görə)</span>
              </label>
              <textarea
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                rows={3}
                placeholder="Müəlliminiz haqqında fikrinizi yazın..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Göndərilir..." : "Rəy göndər"}
            </button>
          </form>
        </div>
      )}

      {tab === "received" && (
        <div className="space-y-3">
          {received.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">Hələ rəy almamısınız</div>
          ) : received.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-800 text-sm">{r.fromUser.name ?? r.fromUser.email}</span>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("az-AZ")}</span>
              </div>
              <Stars value={r.rating} />
              {r.comment && <p className="text-gray-600 text-sm mt-2">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "given" && (
        <div className="space-y-3">
          {given.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">Hələ rəy verməmisiniz</div>
          ) : given.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-800 text-sm">→ {r.toUser.name ?? r.toUser.email}</span>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("az-AZ")}</span>
              </div>
              <Stars value={r.rating} />
              {r.comment && <p className="text-gray-600 text-sm mt-2">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
