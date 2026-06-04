"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Search, PlusCircle, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const items = [
    { href: "/", icon: Home, label: "Inicio" },
    { href: "/buscar", icon: Search, label: "Buscar" },
    { href: "/publicar", icon: PlusCircle, label: "Publicar", cta: true },
    { href: "/mensajes", icon: MessageCircle, label: "Mensajes" },
    { href: session?.user ? "/cuenta" : "/ingresar", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur sm:hidden">
      <div className="flex items-stretch justify-around">
        {items.map((it) => {
          const active = pathname === it.href;
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              href={it.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
                it.cta ? "text-brand-600" : active ? "text-brand-600" : "text-gray-500"
              )}
            >
              <Icon className={it.cta ? "h-7 w-7" : "h-5 w-5"} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
