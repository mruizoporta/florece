"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { DEMO_SLUG, TRIAL_DAYS } from "@florece/shared";

const steps = [
  {
    n: "01",
    title: "Creás tu salón",
    text: `Registrás el negocio, elegís plan y entrás con ${TRIAL_DAYS} días para probar en serio.`,
  },
  {
    n: "02",
    title: "Armás catálogo y equipo",
    text: "Servicios, productos, horarios, roles (agenda, caja, estilista) y tu sitio público.",
  },
  {
    n: "03",
    title: "Operás el día",
    text: "Citas, tablero, cobro, insumos y comisiones — el piso y la caja en el mismo sistema.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
      <p className="text-xs font-bold tracking-[0.18em] text-brand-primary-dark uppercase">
        Cómo arranca
      </p>
      <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
        De cero a salón ordenado
      </h2>
      <p className="mt-4 max-w-xl text-lg text-brand-text-muted">
        Sin instalación cara. Probás el demo o abrís tu cuenta y vas cargando lo
        tuyo.
      </p>

      <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <p className="font-serif text-4xl font-semibold text-brand-primary/80">
              {s.n}
            </p>
            <h3 className="mt-3 font-serif text-2xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">
              {s.text}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href={`/s/${DEMO_SLUG}`}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
        >
          Ver demo del salón
          <ArrowRight size={16} />
        </Link>
        <Link
          href={`/s/${DEMO_SLUG}/admin`}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-ink/15 bg-white px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-warm"
        >
          Entrar al panel demo
        </Link>
      </div>
    </section>
  );
}
