import Link from "next/link";
import { ShieldCheck, Check } from "lucide-react";
import { SAFETY_TIPS } from "@/lib/safety";

export const metadata = { title: "Seguridad en Trato" };

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <ShieldCheck className="h-6 w-6 text-brand-600 dark:text-brand-300" /> Seguridad en Trato
      </h1>
      <p className="mt-2 text-gray-600 dark:text-stone-300">
        En Trato todos se verifican con su identidad, pero para la entrega en persona unos
        cuidados simples nunca están de más. Seguí estos consejos y cerrá el trato tranquilo.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Cuando se encuentren a entregar o recibir</h2>
      <ul className="mt-3 space-y-2.5">
        {SAFETY_TIPS.map((tip) => (
          <li
            key={tip.text}
            className="flex items-start gap-3 rounded-xl border border-line dark:border-stone-800 bg-surface dark:bg-stone-900 p-4"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm text-gray-700 dark:text-stone-200">{tip.text}</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-gray-500 dark:text-stone-400">
        Ante cualquier duda, escribinos desde{" "}
        <Link href="/contacto" className="font-medium text-brand-700 hover:underline dark:text-brand-300">
          Contacto
        </Link>{" "}
        — estamos para ayudarte.
      </p>
    </div>
  );
}
