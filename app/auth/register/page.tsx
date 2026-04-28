"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/ui/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", groupName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Şifrələr uyğun deyil");
      return;
    }
    if (form.password.length < 6) {
      setError("Şifrə ən az 6 simvol olmalıdır");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password, groupName: form.groupName }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Qeydiyyat xətası");
    } else {
      router.push("/auth/signin?registered=1");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mb-6">
            ← Ana səhifə
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Yeni hesab yarat</h1>
          <p className="text-gray-500 mt-1">QA Online Exam Portal</p>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                placeholder="Əli Əliyev"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qrup</label>
              <input
                type="text"
                value={form.groupName}
                onChange={(e) => setForm({ ...form, groupName: e.target.value })}
                className="input-field"
                placeholder="Məs: March-2024, QA-Group-1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-poçt</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="email@example.com"
                required
              />
            </div>
            <PasswordInput
              label="Şifrə"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Ən az 6 simvol"
              required
            />
            <PasswordInput
              label="Şifrəni təsdiqlə"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Şifrəni təkrar daxil et"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-base"
            >
              {loading ? "Qeydiyyat..." : "Qeydiyyatdan keç"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Artıq hesabın var?{" "}
          <Link href="/auth/signin" className="text-blue-600 hover:underline font-medium">
            Daxil ol
          </Link>
        </p>
      </div>
    </div>
  );
}
