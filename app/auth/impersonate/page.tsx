"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ImpersonateInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(true);
      return;
    }
    signIn("credentials", {
      impersonationToken: token,
      callbackUrl: "/dashboard",
    }).catch(() => setError(true));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-sm w-full text-center">
          <p className="text-red-600 font-medium">Giriş xətası baş verdi.</p>
          <p className="text-gray-500 text-sm mt-1">Token etibarsız və ya müddəti bitib.</p>
          <a href="/admin/users" className="btn-secondary mt-4 inline-block text-sm">Geri qayıt</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card max-w-sm w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-700 font-medium">İstifadəçi hesabına daxil olunur...</p>
        <p className="text-gray-400 text-sm mt-1">Bir az gözləyin</p>
      </div>
    </div>
  );
}

export default function ImpersonatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ImpersonateInner />
    </Suspense>
  );
}
