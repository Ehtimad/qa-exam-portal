"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function PerPageSelect({ value }: { value: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function onChange(newPerPage: string) {
    const p = new URLSearchParams(params.toString());
    p.set("perPage", newPerPage);
    p.set("page", "1");
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
    >
      {[10, 25, 50, 100].map((n) => (
        <option key={n} value={n}>{n} / səhifə</option>
      ))}
    </select>
  );
}
