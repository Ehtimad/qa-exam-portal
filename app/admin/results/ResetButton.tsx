"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResetAttemptButton({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!confirm("Bu imtahan nəticəsini silmək istədiyinizə əminsiniz? Tələbə yenidən iştirak edə biləcək.")) return;
    setLoading(true);
    await fetch(`/api/admin/results/${attemptId}`, { method: "DELETE" });
    router.push("/admin/results");
    router.refresh();
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
    >
      {loading ? "Silinir..." : "Nəticəni sil"}
    </button>
  );
}

export function ResetButton({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!confirm("Bu imtahan nəticəsini silmək istədiyinizə əminsiniz? Tələbə yenidən iştirak edə biləcək.")) return;
    setLoading(true);
    await fetch(`/api/admin/results/${attemptId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50"
    >
      {loading ? "Silinir..." : "Sil"}
    </button>
  );
}
