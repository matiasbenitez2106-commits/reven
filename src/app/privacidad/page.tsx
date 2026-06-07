import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";
import { PRIVACY_DOC, LEGAL_UPDATED } from "@/content/legal";

export const metadata: Metadata = {
  title: "Política de Privacidad · Reven",
  description: "Cómo Reven recolecta, usa y protege tus datos personales, conforme a la Ley 25.326 (Argentina).",
};

export default function PrivacidadPage() {
  return <LegalDoc doc={PRIVACY_DOC} updated={LEGAL_UPDATED} />;
}
