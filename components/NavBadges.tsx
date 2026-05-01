"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPusherClient } from "@/lib/pusher-client";

interface Props {
  userId: string;
  showNotifications?: boolean;
  msgHref?: string;
  notifHref?: string;
  linkClass?: string;
}

export default function NavBadges({
  userId,
  showNotifications = false,
  msgHref = "/messages",
  notifHref = "/admin/notifications",
  linkClass = "text-sm text-gray-600 hover:text-gray-900",
}: Props) {
  const [unreadMsg,   setUnreadMsg]   = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);

  useEffect(() => {
    fetch("/api/messages/unread").then((r) => r.json()).then((d) => setUnreadMsg(d.count ?? 0)).catch(() => {});
    if (showNotifications) {
      fetch("/api/notifications").then((r) => r.json()).then((data) => {
        if (Array.isArray(data)) setUnreadNotif(data.filter((n: { isRead: boolean }) => !n.isRead).length);
      }).catch(() => {});
    }
  }, [showNotifications]);

  useEffect(() => {
    const client = getPusherClient();
    const ch = client.subscribe(`private-user-${userId}`);
    ch.bind("new-message", () => setUnreadMsg((v) => v + 1));
    if (showNotifications) {
      ch.bind("notification", () => setUnreadNotif((v) => v + 1));
      const bc = client.subscribe("notifications");
      bc.bind("broadcast", () => setUnreadNotif((v) => v + 1));
      return () => { ch.unbind_all(); bc.unbind_all(); };
    }
    return () => { ch.unbind_all(); };
  }, [userId, showNotifications]);

  function Badge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
      <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
        {count > 99 ? "99+" : count}
      </span>
    );
  }

  return (
    <>
      {showNotifications && (
        <Link href={notifHref} className={`${linkClass} inline-flex items-center`}>
          Bildirişlər<Badge count={unreadNotif} />
        </Link>
      )}
      <Link href={msgHref} className={`${linkClass} inline-flex items-center`}>
        Mesajlar<Badge count={unreadMsg} />
      </Link>
    </>
  );
}
