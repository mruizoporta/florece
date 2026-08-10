"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  MessageCircle,
  Scissors,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import {
  DEMO_SLUG,
  PLANS,
  TRIAL_DAYS,
  planMarketingFeatures,
} from "@florece/shared";
import { SITE } from "@/lib/site";
import { SocialLinks } from "@/components/landing/SocialLinks";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLocale } from "@/components/LocaleProvider";
import { HelpAssistant } from "@/components/assistant/HelpAssistant";

const FAQ = [
  {
    q: "¿Cómo se paga en Nicaragua?",
    a: "Por transferencia, depósito o efectivo. Probás gratis; al renovar, Florece registra tu pago y activa el período. Stripe queda opcional para otros mercados.",
  },
  {
    q: "¿Cuánto dura la prueba?",
    a: `Tenés ${TRIAL_DAYS} días para agendar, vender y mostrar tu sitio. Sin tarjeta obligatoria.`,
  },
  {
    q: "¿Sirve para barberías y spas?",
    a: "Sí. Está pensado para salones, barberías, spas y studios de belleza en Nicaragua: citas, catálogo, POS, piso del estilista y presencia web.",
  },
  {
    q: "¿Los estilistas pueden anotar lo que hacen?",
    a: "Sí. Con el rol Estilista entran a un piso móvil: buscan la hoja de la clienta, anotan el servicio y ven su comisión del día. Caja cierra el ticket al cobrar.",
  },
  {
    q: "¿Puedo escribirles por WhatsApp?",
    a: "Sí. Usá el botón verde o el enlace de contacto: abrimos un chat contigo para activar o renovar tu plan.",
  },
  {
    q: "¿Hay multi-sucursal?",
    a: "Sí en plan Premium: cada sucursal tiene su caja; el dueño ve consolidado. Si necesitás armarlo, hablamos por WhatsApp.",
  },
];

const audience = [
  {
    icon: Scissors,
    title: "Dueños de salón",
    text: "Agenda, equipo, caja y comisiones en un solo panel — sin Excel ni WhatsApp eterno.",
  },
  {
    icon: Store,
    title: "Barberías",
    text: "Turnos claros, hojas de servicio y caja del día. El equipo anota en el piso y vos cobrás.",
  },
  {
    icon: Sparkles,
    title: "Spas y studios",
    text: "Sitio propio, catálogo e Instagram — presencia que vende mientras el piso sigue ordenado.",
  },
];

function WhatsAppFab() {
  return (
    <a
      href={SITE.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/35 transition hover:scale-105"
    >
      <MessageCircle size={26} />
    </a>
  );
}

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { tr, locale } = useLocale();

  return (
    <div className="overflow-x-hidden bg-[#f7f3ea] text-brand-ink">
      <section className="relative min-h-[100svh] overflow-hidden text-white">
        <div className="absolute inset-0 bg-[linear-gradient(155deg,#12100e_0%,#1a1714_42%,#2a241c_78%,#1a1714_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(242,201,76,0.35), transparent 40%), radial-gradient(circle at 80% 60%, rgba(242,201,76,0.2), transparent 45%)",
          }}
        />
        <motion.div
          className="absolute -right-20 top-24 h-80 w-80 rounded-full bg-brand-primary/25 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl"
          animate={{ x: [0, 24, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />

        <header className="relative z-30 border-b border-white/10 bg-[#12141a]/55 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5 sm:px-6">
            <a href="#" className="shrink-0">
              <span className="font-serif text-[1.65rem] leading-none font-semibold tracking-tight text-white">
                Florece
              </span>
            </a>

            <nav className="ml-2 hidden items-center gap-1 lg:flex">
              {[
                { href: "#funciones", label: tr("landing.nav.features") },
                { href: "#planes", label: tr("landing.nav.plans") },
                { href: "#faq", label: tr("landing.nav.faq") },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/8 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <LanguageToggle tone="onDark" />
              <SocialLinks
                className="hidden sm:flex"
                tone="onDark"
                showLabels={false}
              />
              <div className="mx-0.5 hidden h-6 w-px bg-white/15 sm:block" />
              <Link
                href="/login"
                className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                {tr("landing.enter")}
              </Link>
              <Link
                href="/registrar-salon"
                className="rounded-xl bg-brand-primary px-3.5 py-2 text-sm font-semibold text-brand-ink shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:brightness-105"
              >
                {tr("landing.tryFree")}
              </Link>
              <button
                type="button"
                aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/8 text-white lg:hidden"
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {menuOpen ? (
            <div className="border-t border-white/10 bg-[#12141a]/95 px-5 py-4 backdrop-blur-md lg:hidden">
              <nav className="flex flex-col gap-1">
                {[
                  { href: "#funciones", label: "Funciones" },
                  { href: "#planes", label: "Planes" },
                  { href: "#faq", label: "Preguntas" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/8 hover:text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/8"
                  onClick={() => setMenuOpen(false)}
                >
                  Entrar
                </Link>
              </nav>
              <SocialLinks
                className="mt-4"
                tone="onDark"
                showLabels
              />
            </div>
          ) : null}
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5.5rem)] max-w-6xl flex-col justify-center px-6 pb-20 pt-8">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-[clamp(3.4rem,12vw,7.2rem)] leading-[0.9] font-semibold tracking-tight text-white"
          >
            Florece
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 max-w-2xl font-serif text-[clamp(1.55rem,3.5vw,2.6rem)] leading-tight font-medium text-white"
          >
            Tu salón, ordenado y listo para vender en Nicaragua.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 max-w-lg text-lg text-white/75 md:text-xl"
          >
            Citas, catálogo, caja, piso del estilista y sitio web — cobrás por
            transferencia y activamos tu período.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Link
              href={`/s/${DEMO_SLUG}`}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-base font-semibold text-brand-ink transition hover:-translate-y-0.5"
            >
              Probar demo
              <ArrowRight size={18} />
            </Link>
            <a
              href={SITE.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-base font-semibold text-white backdrop-blur hover:bg-white/10"
            >
              <MessageCircle size={18} />
              WhatsApp
            </a>
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl px-4 py-3 text-base font-semibold text-white/80 hover:text-white"
            >
              Entrar
            </Link>
          </motion.div>
        </div>
      </section>

      <section id="funciones" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
          Agenda, cobro, piso y presencia — en un solo lugar
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-brand-text-muted">
          Hecho para dueños de salón en Nicaragua: citas, equipo, caja,
          comisiones y sitio web, sin pelear con Excel ni con sistemas
          genéricos.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {audience.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Icon className="text-brand-primary-dark" size={28} />
                <h3 className="mt-4 font-serif text-2xl">{item.title}</h3>
                <p className="mt-2 text-brand-text-muted">{item.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section
        id="planes"
        className="border-y border-brand-ink/8 bg-white/60 py-20"
      >
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-serif text-4xl font-semibold md:text-5xl">
            {tr("landing.plansTitle")}
          </h2>
          <p className="mt-3 max-w-xl text-brand-text-muted">
            {tr("landing.plansSubtitle")}
          </p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {Object.values(PLANS).map((plan, i) => {
              const bullets = planMarketingFeatures(
                plan.slug,
                locale === "en" ? "en" : "es",
              );
              return (
              <motion.div
                key={plan.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`rounded-3xl border p-6 ${
                  plan.slug === "pro"
                    ? "border-brand-primary bg-[#1a1c22] text-white"
                    : "border-brand-ink/10 bg-white"
                }`}
              >
                <p className="text-sm font-semibold tracking-wide uppercase opacity-70">
                  {plan.name}
                </p>
                <p className="mt-3 font-serif text-4xl">
                  C$ {plan.priceNioMonthly.toLocaleString("es-NI")}
                  <span className="text-base opacity-60">
                    {tr("billing.perMonth")}
                  </span>
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  {bullets.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check
                        size={16}
                        className={
                          plan.slug === "pro"
                            ? "text-brand-primary"
                            : "text-brand-primary-dark"
                        }
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/registrar-salon?plan=${plan.slug}`}
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold ${
                    plan.slug === "pro"
                      ? "bg-brand-primary text-brand-ink"
                      : "bg-brand-ink text-white"
                  }`}
                >
                  {tr("landing.startTrial").replace(
                    "{days}",
                    String(TRIAL_DAYS),
                  )}
                </Link>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="font-serif text-4xl font-semibold">Preguntas</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((item, idx) => {
            const open = openFaq === idx;
            return (
              <div
                key={item.q}
                className="rounded-2xl border border-brand-ink/10 bg-white"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-medium"
                  onClick={() => setOpenFaq(open ? null : idx)}
                >
                  {item.q}
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open ? (
                  <p className="px-5 pb-4 text-sm leading-relaxed text-brand-text-muted">
                    {item.a}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-brand-ink/8 bg-[#1a1c22] px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-3xl">Florece</p>
            <p className="mt-2 max-w-sm text-sm text-white/60">
              Software para salones en Nicaragua. Pago por transferencia.
            </p>
            <SocialLinks className="mt-5" tone="onDark" showLabels />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/70">
            <a href="#funciones" className="hover:text-white">
              Funciones
            </a>
            <a href="#planes" className="hover:text-white">
              Planes
            </a>
            <Link href="/login" className="hover:text-white">
              Entrar
            </Link>
            <Link href="/admin" className="hover:text-white">
              Admin plataforma
            </Link>
          </div>
        </div>
      </footer>

      <HelpAssistant context="landing" offsetRight />
      <WhatsAppFab />
    </div>
  );
}
