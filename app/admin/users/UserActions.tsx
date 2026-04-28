"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string;
  groupName: string | null;
}

export function EditUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);
  const [groupName, setGroupName] = useState(user.groupName ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, groupName, newPassword: newPassword || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      const d = await res.json();
      setError(d.error ?? "Xəta baş verdi");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">İstifadəçini redaktə et</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-poçt</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qrup</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yeni şifrə <span className="text-gray-400 font-normal">(istəyə bağlı)</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Boş buraxılsa dəyişdirilməz"
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} disabled={loading} className="btn-primary flex-1">
            {loading ? "Saxlanılır..." : "Saxla"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">Ləğv et</button>
        </div>
      </div>
    </div>
  );
}

export function UserRow({ student }: { student: User & { createdAt: Date | string } }) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${student.name ?? student.email}" istifadəçisini silmək istədiyinizə əminsiniz?`)) return;
    setDeleting(true);
    await fetch(`/api/admin/users/${student.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      {showEdit && <EditUserModal user={student} onClose={() => setShowEdit(false)} />}
      <tr className="border-b border-gray-50 hover:bg-gray-50">
        <td className="py-3 font-medium text-gray-900">{student.name ?? "–"}</td>
        <td className="py-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {student.groupName ?? "–"}
          </span>
        </td>
        <td className="py-3 text-gray-600">{student.email}</td>
        <td className="py-3 text-gray-500">
          {new Date(student.createdAt).toLocaleDateString("az-AZ")}
        </td>
        <td className="py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
            >
              Redaktə
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50"
            >
              {deleting ? "Silinir..." : "Sil"}
            </button>
          </div>
        </td>
      </tr>
    </>
  );
}
