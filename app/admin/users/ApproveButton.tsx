"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApproveButton({
  userId,
  approved,
}: {
  userId: string;
  approved: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, approved: !approved }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
        approved
          ? "bg-red-50 text-red-600 hover:bg-red-100"
          : "bg-green-50 text-green-700 hover:bg-green-100"
      } disabled:opacity-50`}
    >
      {loading ? "..." : approved ? "Blokla" : "Təsdiq et"}
    </button>
  );
}
