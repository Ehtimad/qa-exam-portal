"use client";

import { useEffect, useState } from "react";

interface Ad {
  id: string;
  title: string;
  content: string;
}

export default function AdsBanner() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/advertisements")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setAds(data))
      .catch(() => {});
  }, []);

  const visible = ads.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map((ad) => (
        <div key={ad.id} className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-800">{ad.title}</p>
            <p className="text-sm text-blue-700 mt-0.5">{ad.content}</p>
          </div>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, ad.id]))}
            className="text-blue-400 hover:text-blue-600 flex-shrink-0 mt-0.5"
            aria-label="Bağla"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
