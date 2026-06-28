"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  MessageCircle,
  LogOut,
  User as UserIcon,
  Package,
  ShieldCheck,
  Heart,
  Crown,
  HandCoins,
} from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { VerificationBadge } from "./VerificationBadge";
import { NotificationBell } from "./NotificationBell";
import { Logo } from "./Logo";

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [adminPending, setAdminPending] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Poll de mensajes no leídos (badge)
  useEffect(() => {
    if (!userId) {
      setUnread(0);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const r = await fetch("/api/messages/unread");
        if (r.ok) {
          const j = await r.json();
          if (active) setUnread(j.count || 0);
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

  // Poll de pendientes para admins (denuncias + verificaciones)
  useEffect(() => {
    if (!isAdmin) {
      setAdminPending(0);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const r = await fetch("/api/admin/pending");
        if (r.ok) {
          const j = await r.json();
          if (active) setAdminPending(j.total || 0);
        }
      } catch {
        /* noop */
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [isAdmin]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/buscar?q=${encodeURIComponent(q)}` : "/buscar");
  }

  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] ?? "";
  const lastName = user?.name?.split(" ").slice(1).join(" ");

  return (
    <header className="sticky top-0 z-40 border-b border-line dark:border-stone-800 bg-surface/95 dark:bg-stone-900/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center" aria-label="trato — inicio">
          <Logo size="md" />
        </Link>

        <form onSubmit={onSearch} className="relative ml-2 hidden flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-stone-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos..."
            className="input pl-9"
            aria-label="Buscar"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          {status === "loading" ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-surface-sunken dark:bg-stone-800" />
          ) : user ? (
            <>
              <Link
                href="/publicar"
                className="hidden items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:inline-flex"
              >
                <Plus className="h-4 w-4" /> Publicar
              </Link>
              <Link
                href="/favoritos"
                className="hidden rounded-lg p-2 text-gray-600 dark:text-stone-300 hover:bg-surface-hover dark:hover:bg-stone-800 sm:block"
                aria-label="Favoritos"
              >
                <Heart className="h-5 w-5" />
              </Link>
              <NotificationBell />
              <Link
                href="/mensajes"
                className="relative rounded-lg p-2 text-gray-600 dark:text-stone-300 hover:bg-surface-hover dark:hover:bg-stone-800"
                aria-label="Mensajes"
              >
                <MessageCircle className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="relative flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-gray-200 dark:hover:ring-stone-700"
                >
                  <Avatar firstName={firstName} lastName={lastName} src={user.image} />
                  {isAdmin && adminPending > 0 && (
                    <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-surface dark:ring-stone-900" />
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl border border-line dark:border-stone-800 bg-surface dark:bg-stone-900 py-1 shadow-lg">
                    <div className="border-b border-line dark:border-stone-800 px-4 py-3">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-stone-400">{user.email}</p>
                      <div className="mt-1">
                        <VerificationBadge status={user.verification} />
                      </div>
                    </div>
                    <MenuLink href="/mis-publicaciones" icon={Package} onClick={() => setMenuOpen(false)}>
                      Mis publicaciones
                    </MenuLink>
                    <MenuLink href="/ofertas" icon={HandCoins} onClick={() => setMenuOpen(false)}>
                      Ofertas recibidas
                    </MenuLink>
                    <MenuLink href="/favoritos" icon={Heart} onClick={() => setMenuOpen(false)}>
                      Favoritos
                    </MenuLink>
                    <MenuLink href="/suscripcion" icon={Crown} onClick={() => setMenuOpen(false)}>
                      Suscripción PRO
                    </MenuLink>
                    <MenuLink href="/mensajes" icon={MessageCircle} onClick={() => setMenuOpen(false)}>
                      Mensajes
                    </MenuLink>
                    <MenuLink href="/verificacion" icon={ShieldCheck} onClick={() => setMenuOpen(false)}>
                      Verificación
                    </MenuLink>
                    <MenuLink href="/cuenta" icon={UserIcon} onClick={() => setMenuOpen(false)}>
                      Mi cuenta
                    </MenuLink>
                    {isAdmin && (
                      <MenuLink href="/admin" icon={ShieldCheck} onClick={() => setMenuOpen(false)}>
                        <span className="flex w-full items-center justify-between">
                          Panel admin
                          {adminPending > 0 && (
                            <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                              {adminPending}
                            </span>
                          )}
                        </span>
                      </MenuLink>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-surface-hover dark:hover:bg-stone-800"
                    >
                      <LogOut className="h-4 w-4" /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/ingresar"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-stone-200 hover:bg-surface-hover dark:hover:bg-stone-800"
              >
                Ingresar
              </Link>
              <Link
                href="/registrarse"
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-stone-200 hover:bg-surface-hover dark:hover:bg-stone-800"
    >
      <Icon className="h-4 w-4 text-gray-500 dark:text-stone-400" /> {children}
    </Link>
  );
}
