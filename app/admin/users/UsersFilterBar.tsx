"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Group { id: string; name: string; }

export default function UsersFilterBar({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(params.toString());
      if (value) p.set(key, value);
      else p.delete(key);
      router.replace(`?${p.toString()}`);
    },
    [params, router]
  );

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <input
        type="text"
        placeholder="Ad, soyad və ya e-poçt axtar..."
        defaultValue={params.get("q") ?? ""}
        onChange={(e) => update("q", e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
      />
      <select
        defaultValue={params.get("group") ?? ""}
        onChange={(e) => update("group", e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Bütün qruplar</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      <select
        defaultValue={params.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Bütün statuslar</option>
        <option value="pending">Gözləyir</option>
        <option value="verified">Təsdiqlənmiş</option>
        <option value="blocked">Bloklanmış</option>
      </select>
    </div>
  );
}
