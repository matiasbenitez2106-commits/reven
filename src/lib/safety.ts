// Consejos de entrega segura (I10). Fuente ÚNICA: los comparten la página
// /seguridad (usa `text`, la lista completa) y la tarjeta "Entrega segura" del
// chat (usa los que tienen `short`, los 3 clave). No duplicar el texto en la UI.

export type SafetyTip = {
  /** Frase completa — la muestra la página /seguridad. */
  text: string;
  /** Versión compacta — solo en los tips clave, para la tarjeta del chat. */
  short?: string;
};

export const SAFETY_TIPS: SafetyTip[] = [
  {
    text: "Juntate en un lugar público y concurrido: un café, un shopping, una estación de subte o tren, o una comisaría.",
    short: "Lugar público y concurrido, de día",
  },
  { text: "De día, mejor." },
  {
    text: "Avisale a alguien de confianza adónde vas, con quién te encontrás y a qué hora.",
    short: "Avisale a alguien de confianza adónde vas",
  },
  {
    text: "Revisá bien el producto antes de pagar, y confirmá el pago antes de entregar.",
    short: "Revisá el producto antes de pagar",
  },
  {
    text: "Si algo te genera desconfianza, no sigas: cancelá el encuentro sin culpa.",
  },
];
