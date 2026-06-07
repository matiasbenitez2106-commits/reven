import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";
import { TERMS_DOC, LEGAL_UPDATED } from "@/content/legal";

export const metadata: Metadata = {
  title: "Términos y Condiciones · Reven",
  description: "Términos y Condiciones de uso de Reven, el marketplace de usados entre particulares verificados.",
};

export default function TerminosPage() {
  return <LegalDoc doc={TERMS_DOC} updated={LEGAL_UPDATED} />;
}
