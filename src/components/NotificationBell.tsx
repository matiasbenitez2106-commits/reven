"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, MessageCircle, ShieldCheck, Flag, Crown } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  MESSAGE: MessageCircle,
  CONTACT: MessageCircle,
  VERIFICATION: ShieldCheck,
  REPORT: Flag,
  SUBSCRIPTION: Crown,
  GENERIC: Bell,
};

export function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const userId = session?.user?.id;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setUnread(0);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const r = await fetch("/api/notifications");
        if (r.ok) {
          const j = await r.json();
          if (active) {
            setItems(j.items);
            setUnread(j.unread);
          }
        }
      } catch {
        /* noop */
      }
    };
    load();
    const id = setInterval(load, 20000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [userId]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      try {
        await fetch("/api/notifications/read", { method: "POST" });
      } catch {
        /* noop */
      }
    }
  }

  function openItem(n: Notif) {
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  if (!userId) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative rounded-lg p-2 text-gray-600 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-800"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-gray-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-lg">
          <div className="border-b border-gray-100 dark:border-stone-800 px-4 py-2 text-sm font-semibold">
            Notificaciones
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-stone-500">
                No tenés notificaciones
              </p>
            ) : (
              items.map((n) => {
                const Icon = ICONS[n.type] ?? Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => openItem(n)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left last:border-0 hover:bg-gray-50 dark:hover:bg-stone-800",
                      !n.read && "bg-brand-50/60 dark:bg-brand-900/30"
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-stone-100">{n.title}</p>
                      {n.body && <p className="truncate text-xs text-gray-500 dark:text-stone-400">{n.body}</p>}
                      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-stone-500">
                        {formatRelative(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
