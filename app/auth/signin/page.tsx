"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/ui/PasswordInput";


export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-poçt və ya şifrə yanlışdır");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mb-6">
            ← Ana səhifə
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Hesaba daxil ol</h1>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-poçt
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="email@example.com"
                required
              />
            </div>
            <PasswordInput
              label="Şifrə"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-base"
            >
              {loading ? "Yüklənir..." : "Daxil ol"}
            </button>
          </form>

        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Hesabın yoxdur?{" "}
          <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
            Qeydiyyat
          </Link>
        </p>
      </div>
    </div>
  );
}
