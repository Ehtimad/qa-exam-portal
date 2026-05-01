"use client";

import { useEffect } from "react";

export default function Heartbeat() {
  useEffect(() => {
    async function ping() {
      await fetch("/api/user/heartbeat", { method: "POST" }).catch(() => {});
    }
    ping();
    const id = setInterval(ping, 30_000);
    return () => clearInterval(id);
  }, []);

  return null;
}
