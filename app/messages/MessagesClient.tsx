"use client";

import { useEffect, useState, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/rbac";

interface Contact {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  unread: number;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  senderName?: string;
}

export default function MessagesClient({ userId, userName }: { userId: string; userName: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/messages/contacts")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setContacts(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const client = getPusherClient();
    const ch = client.subscribe(`private-user-${userId}`);
    ch.bind("new-message", (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setContacts((prev) =>
        prev.map((c) =>
          c.id === msg.senderId && msg.senderId !== active?.id
            ? { ...c, unread: c.unread + 1 }
            : c
        )
      );
    });
    return () => { ch.unbind_all(); };
  }, [userId, active?.id]);

  useEffect(() => {
    if (!active) return;
    fetch(`/api/messages?with=${active.id}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setMessages(data))
      .catch(() => {});
    setContacts((prev) => prev.map((c) => (c.id === active.id ? { ...c, unread: 0 } : c)));
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!draft.trim() || !active || sending) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: active.id, content: draft.trim() }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setDraft("");
    }
    setSending(false);
  }

  const filtered = contacts.filter((c) =>
    (c.name ?? c.email).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Contacts list */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">Mesajlar</h2>
          <input
            type="text"
            placeholder="Axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-50 ${
                active?.id === c.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                {(c.name ?? c.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.name ?? c.email}</p>
                  {c.unread > 0 && (
                    <span className="ml-1 h-5 min-w-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] ${ROLE_COLORS[c.role] ?? "bg-gray-100 text-gray-500"}`}>
                    {ROLE_LABELS[c.role] ?? c.role}
                  </span>
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">İstifadəçi tapılmadı</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {active ? (
          <>
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                {(active.name ?? active.email)[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{active.name ?? active.email}</p>
                <p className="text-xs text-gray-500">{active.email}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {messages.map((m) => {
                const isMe = m.senderId === userId;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                    }`}>
                      <p>{m.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                        {new Date(m.createdAt).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!draft.trim() || sending}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Göndər
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Söhbət başlatmaq üçün sol tərəfdən istifadəçi seçin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
