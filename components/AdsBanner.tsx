"use client";

import { useEffect, useState } from "react";

interface Ad {
  id: string;
  title: string;
  content: string;
}

export default function AdsBanner() {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    fetch("/api/advertisements")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setAds(data))
      .catch(() => {});
  }, []);

  if (ads.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {ads.map((ad) => (
        <div key={ad.id} className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-blue-800">{ad.title}</p>
          <p className="text-sm text-blue-700 mt-0.5">{ad.content}</p>
        </div>
      ))}
    </div>
  );
}
