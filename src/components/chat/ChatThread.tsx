"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Msg {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
}

const POLL_MS = 4000;

export function ChatThread({
  conversationId,
  meId,
  initialMessages,
  disabled,
  className,
}: {
  conversationId: string;
  meId: string;
  initialMessages: Msg[];
  disabled?: boolean;
  className?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAtRef = useRef<string>(initialMessages.at(-1)?.createdAt ?? "");

  useEffect(() => {
    if (messages.length) lastAtRef.current = messages[messages.length - 1].createdAt;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling (MVP). Para tiempo real usar Supabase Realtime / Pusher / Ably.
  useEffect(() => {
    const interval = setInterval(async () => {
      const after = lastAtRef.current;
      const url = `/api/conversations/${conversationId}/messages${
        after ? `?after=${encodeURIComponent(after)}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) return;
      const j = await res.json();
      if (j.messages?.length) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const add = j.messages.filter((m: Msg) => !ids.has(m.id));
          return add.length ? [...prev, ...add] : prev;
        });
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [conversationId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const m: Msg = await res.json();
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        setText("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex-1 space-y-2 overflow-y-auto p-1">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-stone-500">
            Todavía no hay mensajes. ¡Escribí el primero!
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                  mine
                    ? "rounded-br-sm bg-brand-600 text-white"
                    : "rounded-bl-sm bg-surface-sunken dark:bg-stone-800 text-gray-800 dark:text-stone-100"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn("mt-0.5 text-[10px]", mine ? "text-brand-100" : "text-gray-400 dark:text-stone-500")}>
                  {new Date(m.createdAt).toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-2 flex items-center gap-2 border-t border-line dark:border-stone-800 pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "No disponible" : "Escribí un mensaje..."}
          className="input"
        />
        <button
          type="submit"
          disabled={disabled || sending || !text.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
