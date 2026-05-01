"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/rbac";

interface Group { id: string; name: string; }

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  groupName: string | null;
  groupId: string | null;
  emailVerified: Date | string | null;
  isBlocked: boolean;
  isStudent?: boolean;
  createdAt: Date | string;
  deletedAt?: Date | string | null;
}

const ALL_ROLES = ["student", "admin", "manager", "reporter", "worker", "teacher"] as const;

export function CreateUserModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("student");
  const [groupId, setGroupId] = useState("");
  const [isStudent, setIsStudent] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/groups").then((r) => r.json()).then(setGroups).catch(() => {});
  }, []);

  useEffect(() => {
    setIsStudent(role === "student");
  }, [role]);

  async function handleCreate() {
    if (!name.trim() || !email.trim() || !password.trim()) { setError("Ad, e-poçt və şifrə tələb olunur"); return; }
    if (role === "student" && !groupId) { setError("Tələbə üçün qrup seçin"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role, groupId: groupId || null, isStudent }),
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
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Yeni İstifadəçi Yarat</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-poçt</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifrə</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qrup <span className="text-gray-400 font-normal">(tələbələr üçün)</span>
            </label>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Qrup seçin —</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          {role !== "student" && (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setIsStudent(!isStudent)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isStudent ? "bg-blue-600" : "bg-gray-300"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isStudent ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-sm text-gray-700">Tələbə kimi qeydiyyat</span>
            </div>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleCreate} disabled={loading} className="btn-primary flex-1">
            {loading ? "Yaradılır..." : "Yarat"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">Ləğv et</button>
        </div>
      </div>
    </div>
  );
}

export function EditUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [groupId, setGroupId] = useState(user.groupId ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/groups").then((r) => r.json()).then(setGroups).catch(() => {});
  }, []);

  async function handleSave() {
    if (role === "student" && !groupId) { setError("Qrup seçin"); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        role,
        groupId: groupId || null,
        newPassword: newPassword || undefined,
      }),
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
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-poçt</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qrup <span className="text-gray-400 font-normal">(tələbələr üçün)</span>
            </label>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Qrup seçin —</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yeni şifrə <span className="text-gray-400 font-normal">(istəyə bağlı)</span>
            </label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Boş buraxılsa dəyişdirilməz" minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

function SoftDeleteModal({ user, onClose }: { user: User; onClose: () => void }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!reason.trim()) { setError("Səbəb daxil edin"); return; }
    setLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() }),
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">İstifadəçini sil</h2>
        <p className="text-sm text-gray-500 mb-4">
          <strong>{user.name ?? user.email}</strong> hesabı deaktiv ediləcək. Silmə səbəbini daxil edin.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Məs: Müqavilə bitdi, spam hesabı..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
        />
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        <div className="flex gap-3 mt-4">
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            {loading ? "Silinir..." : "Sil"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">Ləğv et</button>
        </div>
      </div>
    </div>
  );
}

export function UserRow({ student, showRole }: { student: User; showRole?: boolean }) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isVerified = !!student.emailVerified;
  const isDeleted = !!student.deletedAt;

  async function doAction(action: string) {
    setActionLoading(action);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: student.id, action }),
    });
    setActionLoading(null);
    router.refresh();
  }

  async function handleImpersonate() {
    if (!confirm(`"${student.name ?? student.email}" istifadəçisi kimi daxil olmaq istədiyinizə əminsiniz?`)) return;
    setActionLoading("impersonate");
    const res = await fetch(`/api/admin/users/${student.id}/impersonate`, { method: "POST" });
    if (res.ok) {
      const { token } = await res.json();
      window.open(`/auth/impersonate?token=${token}`, "_blank");
    }
    setActionLoading(null);
  }

  return (
    <>
      {showEdit && <EditUserModal user={student} onClose={() => setShowEdit(false)} />}
      {showDeleteModal && <SoftDeleteModal user={student} onClose={() => setShowDeleteModal(false)} />}
      <tr className={`border-b border-gray-50 hover:bg-gray-50 ${isDeleted ? "opacity-50" : ""}`}>
        <td className="px-3 py-3">
          <div className="font-medium text-gray-900">{student.name ?? "–"}</div>
          {student.isBlocked && <span className="text-xs text-red-600 font-medium">Bloklanmış</span>}
          {isDeleted && <span className="text-xs text-gray-400 font-medium ml-1">Silinmiş</span>}
        </td>
        <td className="px-3 py-3">
          {showRole ? (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[student.role] ?? "bg-gray-100 text-gray-600"}`}>
              {ROLE_LABELS[student.role] ?? student.role}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {student.groupName ?? "–"}
            </span>
          )}
        </td>
        <td className="px-3 py-3 text-gray-600">{student.email}</td>
        <td className="px-3 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            isVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}>
            {isVerified ? "Təsdiqlənmiş" : "Gözləyir"}
          </span>
        </td>
        <td className="px-3 py-3 text-gray-500 text-sm">
          {new Date(student.createdAt).toLocaleDateString("az-AZ")}
        </td>
        <td className="px-3 py-3 text-right">
          {isDeleted ? (
            <span className="text-xs text-gray-400 italic">Deaktiv</span>
          ) : (
            <div className="flex items-center justify-end gap-1 flex-wrap">
              {!isVerified ? (
                <button onClick={() => doAction("verify")} disabled={actionLoading === "verify"}
                  className="text-xs text-green-700 hover:text-green-900 font-medium px-2 py-1 rounded hover:bg-green-50">
                  {actionLoading === "verify" ? "..." : "Təsdiqlə"}
                </button>
              ) : (
                <button onClick={() => doAction("unverify")} disabled={actionLoading === "unverify"}
                  className="text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-1 rounded hover:bg-amber-50">
                  {actionLoading === "unverify" ? "..." : "Ləğv et"}
                </button>
              )}
              {!student.isBlocked ? (
                <button onClick={() => doAction("block")} disabled={actionLoading === "block"}
                  className="text-xs text-orange-600 hover:text-orange-800 font-medium px-2 py-1 rounded hover:bg-orange-50">
                  {actionLoading === "block" ? "..." : "Blokla"}
                </button>
              ) : (
                <button onClick={() => doAction("unblock")} disabled={actionLoading === "unblock"}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50">
                  {actionLoading === "unblock" ? "..." : "Bloku aç"}
                </button>
              )}
              <button onClick={() => setShowEdit(true)}
                className="text-xs text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">
                Redaktə
              </button>
              <button onClick={handleImpersonate} disabled={actionLoading === "impersonate"}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-1 rounded hover:bg-purple-50">
                {actionLoading === "impersonate" ? "..." : "Giriş"}
              </button>
              <button onClick={() => setShowDeleteModal(true)}
                className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50">
                Sil
              </button>
            </div>
          )}
        </td>
      </tr>
    </>
  );
}
