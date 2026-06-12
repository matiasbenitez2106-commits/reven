import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export interface LegalSection {
  heading: string;
  body: string[];
  bullets?: string[];
}

export interface LegalDocContent {
  title: string;
  intro: string;
  sections: LegalSection[];
}

/** Renderiza un documento legal (Términos, Privacidad) con estilo consistente. */
export function LegalDoc({ doc, updated }: { doc: LegalDocContent; updated: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 dark:text-stone-400 hover:text-brand-600 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al inicio
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-stone-100">{doc.title}</h1>
      <p className="mt-1 text-sm text-gray-400 dark:text-stone-500">Última actualización: {updated}</p>

      <p className="mt-6 leading-relaxed text-gray-600 dark:text-stone-300">{doc.intro}</p>

      <div className="mt-8 space-y-8">
        {doc.sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-stone-100">
              {i + 1}. {s.heading}
            </h2>
            <div className="mt-2 space-y-3 leading-relaxed text-gray-600 dark:text-stone-300">
              {s.body.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {s.bullets && s.bullets.length > 0 && (
                <ul className="list-disc space-y-1 pl-5">
                  {s.bullets.map((b, k) => (
                    <li key={k}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 border-t border-gray-100 dark:border-stone-800 pt-6 text-xs text-gray-400 dark:text-stone-500">
        Este documento es un resumen informativo para el funcionamiento del servicio y no
        constituye asesoramiento legal. Ante dudas, consultá con un profesional.
      </p>
    </div>
  );
}
