"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const TOPICS = [
  { value: "SOPORTE", label: "Soporte / ayuda" },
  { value: "PRIVACIDAD", label: "Privacidad y datos" },
  { value: "DENUNCIA", label: "Denuncia / reporte" },
  { value: "OTRO", label: "Otro" },
];

export default function ContactPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [topic, setTopic] = useState("SOPORTE");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || "No se pudo enviar el mensaje.");
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Mail className="h-6 w-6 text-brand-600 dark:text-brand-300" /> Contacto
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-stone-400">
        ¿Necesitás ayuda o querés escribirnos sobre tu privacidad? Dejanos tu mensaje y te
        respondemos por email.
      </p>

      {done ? (
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-green-50 dark:bg-green-950/40 p-4 text-sm text-green-700 dark:text-green-300">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">¡Recibimos tu mensaje!</p>
            <p>Te vamos a responder al email que dejaste lo antes posible.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="card mt-6 space-y-4 p-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Nombre</label>
              <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="topic">Tema</label>
            <select id="topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="message">Mensaje</label>
            <textarea id="message" rows={5} className="input" value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Enviar mensaje
          </button>
        </form>
      )}
    </div>
  );
}
