import { TRIAL_DAYS } from "@florece/shared";
import {
  HELP_ARTICLES,
  type HelpLocale,
  type Localized,
  tHelp,
} from "./help-manual";

export type AssistantContext = "landing" | "admin" | "salon";

export type AssistantEntry = {
  id: string;
  contexts: AssistantContext[];
  keywords: string[];
  title: Localized;
  answer: Localized;
  /** Deep-link under /s/{slug}/admin */
  adminHref?: string;
  /** Opens help manual ?topic= */
  helpTopic?: string;
};

function joinAnswer(
  summary: Localized,
  steps?: Localized[],
  tips?: Localized[],
): Localized {
  const locales: HelpLocale[] = ["es", "en"];
  const out = { es: "", en: "" };
  for (const loc of locales) {
    const parts = [summary[loc]];
    if (steps?.length) {
      parts.push(
        steps.map((s, i) => `${i + 1}. ${s[loc]}`).join("\n"),
      );
    }
    if (tips?.length) {
      parts.push(tips.map((t) => `• ${t[loc]}`).join("\n"));
    }
    out[loc] = parts.filter(Boolean).join("\n\n");
  }
  return out;
}

/** Landing / marketing FAQs (no AI). */
const LANDING_ENTRIES: AssistantEntry[] = [
  {
    id: "landing-pay",
    contexts: ["landing"],
    keywords: [
      "pagar",
      "pago",
      "precio",
      "nicaragua",
      "transferencia",
      "depósito",
      "deposit",
      "stripe",
      "costo",
      "cuánto",
      "cuanto",
    ],
    title: {
      es: "¿Cómo se paga en Nicaragua?",
      en: "How do you pay in Nicaragua?",
    },
    answer: {
      es: `Por transferencia, depósito o efectivo. Probás gratis ${TRIAL_DAYS} días; al renovar, Florece registra tu pago y activa el período. No hace falta tarjeta obligatoria.`,
      en: `By transfer, deposit, or cash. You try free for ${TRIAL_DAYS} days; when renewing, Florece records your payment and activates the period. No card required.`,
    },
  },
  {
    id: "landing-trial",
    contexts: ["landing"],
    keywords: [
      "prueba",
      "trial",
      "gratis",
      "días",
      "dias",
      "demo",
      "probar",
    ],
    title: {
      es: "¿Cuánto dura la prueba?",
      en: "How long is the trial?",
    },
    answer: {
      es: `Tenés ${TRIAL_DAYS} días para agendar, vender y mostrar tu sitio. Sin tarjeta obligatoria.`,
      en: `You get ${TRIAL_DAYS} days to book, sell, and show your site. No card required.`,
    },
  },
  {
    id: "landing-who",
    contexts: ["landing"],
    keywords: [
      "barbería",
      "barberia",
      "spa",
      "studio",
      "salón",
      "salon",
      "sirve",
      "para quién",
      "para quien",
    ],
    title: {
      es: "¿Sirve para barberías y spas?",
      en: "Does it work for barbershops and spas?",
    },
    answer: {
      es: "Sí. Está pensado para salones, barberías, spas y studios de belleza en Nicaragua: citas, catálogo, POS y presencia web.",
      en: "Yes. Built for salons, barbershops, spas, and beauty studios in Nicaragua: appointments, catalog, POS, and web presence.",
    },
  },
  {
    id: "landing-whatsapp",
    contexts: ["landing"],
    keywords: [
      "whatsapp",
      "contactar",
      "hablar",
      "escribir",
      "soporte",
      "ayuda",
    ],
    title: {
      es: "¿Puedo escribirles por WhatsApp?",
      en: "Can I message you on WhatsApp?",
    },
    answer: {
      es: "Sí. Usá el botón de WhatsApp para activar, renovar o consultar planes. El equipo de Florece te responde.",
      en: "Yes. Use the WhatsApp button to activate, renew, or ask about plans. The Florece team will reply.",
    },
  },
  {
    id: "landing-branches",
    contexts: ["landing", "admin"],
    keywords: [
      "sucursal",
      "sucursales",
      "multi",
      "varias",
      "branches",
      "multi-sucursal",
    ],
    title: {
      es: "¿Hay multi-sucursal?",
      en: "Is there multi-branch?",
    },
    answer: {
      es: "Sí, en plan Premium: varias sucursales con caja local y resúmenes consolidados. En Pro/Básico operás una sucursal. Escribinos por WhatsApp si querés ampliar.",
      en: "Yes, on Premium: multiple branches with local POS and consolidated rollups. Pro/Basic run one branch. Message us on WhatsApp to expand.",
    },
    adminHref: "/branches",
    helpTopic: "sucursales",
  },
  {
    id: "landing-plans",
    contexts: ["landing", "admin"],
    keywords: [
      "plan",
      "planes",
      "básico",
      "basico",
      "pro",
      "premium",
      "precio",
      "699",
      "1399",
      "2499",
    ],
    title: {
      es: "¿Qué incluyen los planes?",
      en: "What do the plans include?",
    },
    answer: {
      es: "Básico: agenda, catálogo y clientes. Pro: + POS, contabilidad, sitio (secciones/imágenes) e Instagram. Premium: + patrocinadores, límites ilimitados y multi-sucursal.",
      en: "Basic: schedule, catalog, and customers. Pro: + POS, accounting, site (sections/images), and Instagram. Premium: + sponsors, unlimited limits, and multi-branch.",
    },
    adminHref: "/billing",
    helpTopic: "facturacion",
  },
];

/** Public salon visitor FAQs. */
const SALON_ENTRIES: AssistantEntry[] = [
  {
    id: "salon-book",
    contexts: ["salon"],
    keywords: [
      "cita",
      "citas",
      "agendar",
      "reservar",
      "turno",
      "booking",
      "appointment",
      "horario disponible",
    ],
    title: {
      es: "¿Cómo agendo una cita?",
      en: "How do I book an appointment?",
    },
    answer: {
      es: "Tocá «Agendar cita», elegí servicios, profesional, fecha y hora, y dejá tu nombre y teléfono. Te confirmamos la reserva.",
      en: "Tap “Book appointment”, choose services, professional, date and time, then leave your name and phone. We’ll confirm the booking.",
    },
  },
  {
    id: "salon-services",
    contexts: ["salon"],
    keywords: [
      "servicio",
      "servicios",
      "precio",
      "precios",
      "catálogo",
      "catalogo",
      "qué ofrecen",
      "que ofrecen",
    ],
    title: {
      es: "¿Dónde veo servicios y precios?",
      en: "Where are services and prices?",
    },
    answer: {
      es: "En la sección Servicios de esta página están el catálogo y los precios. También podés verlos al agendar.",
      en: "The Services section on this page lists the catalog and prices. You’ll also see them when booking.",
    },
  },
  {
    id: "salon-hours",
    contexts: ["salon"],
    keywords: [
      "horario",
      "horarios",
      "abre",
      "cierra",
      "abierto",
      "hours",
      "cuándo",
      "cuando",
    ],
    title: {
      es: "¿Cuál es el horario?",
      en: "What are the hours?",
    },
    answer: {
      es: "El horario del salón está en el pie de página (y a veces en la sección Acerca de). Si no lo ves, escribinos por WhatsApp.",
      en: "Salon hours are in the footer (and sometimes About). If you don’t see them, message us on WhatsApp.",
    },
  },
  {
    id: "salon-contact",
    contexts: ["salon"],
    keywords: [
      "whatsapp",
      "teléfono",
      "telefono",
      "llamar",
      "contacto",
      "dirección",
      "direccion",
      "ubicación",
      "ubicacion",
      "dónde",
      "donde",
    ],
    title: {
      es: "¿Cómo los contacto?",
      en: "How do I contact you?",
    },
    answer: {
      es: "Usá el botón verde de WhatsApp o los datos del pie (teléfono, dirección). Es la forma más rápida de consultar.",
      en: "Use the green WhatsApp button or the footer details (phone, address). That’s the fastest way to reach us.",
    },
  },
  {
    id: "salon-cancel",
    contexts: ["salon"],
    keywords: [
      "cancelar",
      "reprogramar",
      "cambiar",
      "mover",
      "cancel",
      "reschedule",
    ],
    title: {
      es: "¿Puedo cancelar o cambiar mi cita?",
      en: "Can I cancel or change my appointment?",
    },
    answer: {
      es: "Escribinos por WhatsApp con tu nombre y la fecha de la cita. El salón te ayuda a reprogramar o cancelar.",
      en: "Message us on WhatsApp with your name and appointment date. The salon will help reschedule or cancel.",
    },
  },
];

const ADMIN_FROM_MANUAL: AssistantEntry[] = HELP_ARTICLES.map((article) => ({
  id: `help-${article.id}`,
  contexts: ["admin"] as AssistantContext[],
  keywords: [
    ...article.keywords,
    ...Object.values(article.title).flatMap((t) =>
      t.toLowerCase().split(/\s+/),
    ),
  ],
  title: article.title,
  answer: joinAnswer(article.summary, article.steps, article.tips),
  adminHref: article.href,
  helpTopic: article.id,
}));

export const ASSISTANT_KB: AssistantEntry[] = [
  ...LANDING_ENTRIES,
  ...SALON_ENTRIES,
  ...ADMIN_FROM_MANUAL,
];

export type AssistantMatch = {
  entry: AssistantEntry;
  score: number;
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 1);
}

/** Rule-based matcher (no AI). */
export function matchAssistantEntries(
  query: string,
  context: AssistantContext,
  limit = 3,
): AssistantMatch[] {
  const q = normalize(query);
  if (!q) return [];
  const qTokens = tokens(query);
  const pool = ASSISTANT_KB.filter((e) => e.contexts.includes(context));

  const scored: AssistantMatch[] = [];
  for (const entry of pool) {
    let score = 0;
    const titleEs = normalize(entry.title.es);
    const titleEn = normalize(entry.title.en);
    const answerEs = normalize(entry.answer.es);
    const kw = entry.keywords.map(normalize);

    if (titleEs.includes(q) || titleEn.includes(q)) score += 12;
    for (const k of kw) {
      if (!k) continue;
      if (q === k || q.includes(k) || k.includes(q)) score += 8;
    }
    for (const t of qTokens) {
      if (kw.some((k) => k === t || k.includes(t) || t.includes(k))) score += 3;
      if (titleEs.includes(t) || titleEn.includes(t)) score += 2;
      if (answerEs.includes(t)) score += 1;
    }
    if (score > 0) scored.push({ entry, score });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function assistantSuggestions(
  context: AssistantContext,
  locale: HelpLocale,
): { id: string; label: string }[] {
  const ids =
    context === "landing"
      ? ["landing-plans", "landing-trial", "landing-pay", "landing-whatsapp"]
      : context === "salon"
        ? ["salon-book", "salon-services", "salon-hours", "salon-contact"]
        : ["help-citas", "help-caja", "help-catalogo", "help-facturacion"];

  return ids
    .map((id) => ASSISTANT_KB.find((e) => e.id === id))
    .filter(Boolean)
    .map((e) => ({
      id: e!.id,
      label: tHelp(e!.title, locale),
    }));
}

export { tHelp };
