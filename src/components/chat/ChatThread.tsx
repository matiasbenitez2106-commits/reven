"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Tag, Star } from "lucide-react";
import type { OfferStatus } from "@prisma/client";
import { cn, hideContactInfo, hasContactInfo, formatPrice } from "@/lib/utils";
import { actorRole, proposerRole, canActOnOffer, isOfferExpired } from "@/lib/offers";
import { OfferActionButtons } from "@/components/offers/OfferActionButtons";

interface OfferInfo {
  id: string;
  amount: number;
  status: OfferStatus;
  proposedById: string;
  buyerId: string;
  sellerId: string;
  expiresAt: string;
}

interface Msg {
  id: string;
  kind: "TEXT" | "OFFER";
  body: string;
  senderId: string;
  createdAt: string;
  offer?: OfferInfo | null;
}

const POLL_MS = 4000;

// Etiqueta + color del estado de la oferta para el card. Una PENDING vencida se
// muestra como "Vencida".
function offerStatusMeta(status: OfferStatus, expired: boolean) {
  const s = status === "PENDING" && expired ? "EXPIRED" : status;
  switch (s) {
    case "PENDING":
      return { label: "Pendiente", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" };
    case "ACCEPTED":
      return { label: "Aceptada", cls: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" };
    case "REJECTED":
      return { label: "Rechazada", cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" };
    case "COUNTERED":
      return { label: "Contraofertada", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" };
    case "CANCELLED":
      return { label: "Cancelada", cls: "bg-gray-100 text-gray-600 dark:bg-stone-700 dark:text-stone-300" };
    default:
      return { label: "Vencida", cls: "bg-gray-100 text-gray-600 dark:bg-stone-700 dark:text-stone-300" };
  }
}

export function ChatThread({
  conversationId,
  meId,
  initialMessages,
  unlocked = false,
  buyerRating = null,
  disabled,
  className,
}: {
  conversationId: string;
  meId: string;
  initialMessages: Msg[];
  unlocked?: boolean;
  // Reputación COMO COMPRADOR del comprador del hilo (o null si no tiene reseñas).
  // El card de oferta se la muestra SOLO al vendedor.
  buyerRating?: { rating: number; count: number } | null;
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

  // Re-fetch del hilo COMPLETO: tras aceptar/rechazar/contraofertar, el actor ve
  // el card con su nuevo estado al instante (la otra parte, al recargar/pollear).
  async function refetch() {
    const res = await fetch(`/api/conversations/${conversationId}/messages`);
    if (!res.ok) return;
    const j = await res.json();
    if (Array.isArray(j.messages)) setMessages(j.messages);
  }

  // Nota sutil (solo si está locked): ¿algún mensaje TEXT tiene contacto enmascarado?
  // Los cards de oferta nunca cuentan (sus montos no se enmascaran).
  const anyMasked = !unlocked && messages.some((m) => m.kind !== "OFFER" && hasContactInfo(m.body));

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
          const time = new Date(m.createdAt).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          });

          // ── Card de OFERTA (la negociación vive en el chat) ──
          if (m.kind === "OFFER" && m.offer) {
            const offer = m.offer;
            const expired = isOfferExpired(offer.status, new Date(offer.expiresAt), new Date());
            const meta = offerStatusMeta(offer.status, expired);
            const actor = actorRole(offer, meId);
            const proposer = proposerRole(offer);
            // El ★ del comprador se lo mostramos al VENDEDOR (quien acepta), no al
            // propio comprador sobre su oferta.
            const viewerIsSeller = meId === offer.sellerId;
            // Solo se puede actuar si la publi está disponible (no DELETED).
            const can = (action: "accept" | "reject" | "counter" | "cancel") =>
              !disabled && actor !== null &&
              canActOnOffer({ status: offer.status, proposer, actor, action });
            const canAccept = can("accept");
            const canReject = can("reject");
            const canCounter = can("counter");
            const canCancel = can("cancel");
            const showButtons = canAccept || canReject || canCounter || canCancel;

            return (
              <div key={m.id} className="flex justify-center py-1">
                <div className="w-full max-w-[88%] rounded-xl border border-line dark:border-stone-700 bg-surface dark:bg-stone-900 p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15">
                        <Tag className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[11px] text-gray-500 dark:text-stone-400">
                          {mine ? "Tu oferta" : "Oferta"}
                        </p>
                        {/* El monto NUNCA pasa por hideContactInfo (I4 solo enmascara TEXT). */}
                        <p className="text-lg font-bold leading-tight">{formatPrice(offer.amount)}</p>
                        {/* Reputación del comprador, solo para el vendedor y si tiene reseñas. */}
                        {viewerIsSeller && buyerRating && (
                          <span className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] text-gray-600 dark:text-stone-300">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {buyerRating.rating.toLocaleString("es-AR", {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })}
                            <span className="text-gray-400 dark:text-stone-500">({buyerRating.count})</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", meta.cls)}>
                      {meta.label}
                    </span>
                  </div>

                  {showButtons && (
                    <div className="mt-3">
                      <OfferActionButtons
                        offerId={offer.id}
                        canAccept={canAccept}
                        canReject={canReject}
                        canCounter={canCounter}
                        canCancel={canCancel}
                        onDone={refetch}
                      />
                    </div>
                  )}

                  <p className="mt-1.5 text-[10px] text-gray-400 dark:text-stone-500">{time}</p>
                </div>
              </div>
            );
          }

          // ── Mensaje de TEXTO ──
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
                {/* Enmascaramos AL MOSTRAR salvo que el trato esté acordado (unlocked).
                    El Message original queda CRUDO en la DB siempre (invariante de I4). */}
                <p className="whitespace-pre-wrap break-words">
                  {unlocked ? m.body : hideContactInfo(m.body)}
                </p>
                <p className={cn("mt-0.5 text-[10px]", mine ? "text-brand-100" : "text-gray-400 dark:text-stone-500")}>
                  {time}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {unlocked ? (
        <p className="mt-1 px-1 text-[11px] text-green-700 dark:text-green-400">
          Trato acordado ✅ Ya pueden compartir su contacto para coordinar la entrega. Cuidá
          tus datos y encontrate en un lugar seguro.
        </p>
      ) : anyMasked ? (
        <p className="mt-1 px-1 text-[11px] text-gray-400 dark:text-stone-500">
          Por tu seguridad, los datos de contacto se ocultan — hacé el trato dentro de Trato.
        </p>
      ) : null}

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
