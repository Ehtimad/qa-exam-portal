"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";

interface Ad {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
}

export default function AdsBanner() {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    fetch("/api/advertisements")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setAds(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const client = getPusherClient();
    const ch = client.subscribe("advertisements");
    ch.bind("ad-deleted", ({ id }: { id: string }) => {
      setAds((prev) => prev.filter((a) => a.id !== id));
    });
    ch.bind("ad-updated", (updated: Ad) => {
      if (!updated.isActive) {
        setAds((prev) => prev.filter((a) => a.id !== updated.id));
      } else {
        setAds((prev) => prev.map((a) => a.id === updated.id ? updated : a));
      }
    });
    return () => { ch.unbind_all(); };
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
