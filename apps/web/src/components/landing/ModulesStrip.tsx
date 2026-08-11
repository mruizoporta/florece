"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  ClipboardList,
  Globe2,
  LayoutDashboard,
  MessageCircle,
  Package,
  Percent,
  Scissors,
  ShoppingCart,
  Users,
} from "lucide-react";

const modules = [
  {
    icon: LayoutDashboard,
    title: "Panel",
    text: "Ingresos y citas del día",
  },
  {
    icon: CalendarDays,
    title: "Agenda",
    text: "Mes, semana y por estilista",
  },
  {
    icon: ClipboardList,
    title: "Tablero",
    text: "Flujo del piso en vivo",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp citas",
    text: "Confirmar y recordar al toque",
  },
  {
    icon: ShoppingCart,
    title: "Caja / POS",
    text: "Cobro e impresión",
  },
  {
    icon: Package,
    title: "Inventario",
    text: "Vitrina + insumos g/ml",
  },
  {
    icon: Scissors,
    title: "Piso",
    text: "Anotar y ver comisión",
  },
  {
    icon: Percent,
    title: "Comisiones",
    text: "Sin Excel al cierre",
  },
  {
    icon: Users,
    title: "Equipo y roles",
    text: "Agenda, caja, estilista",
  },
  {
    icon: Globe2,
    title: "Sitio + reservas",
    text: "Marca, Instagram, agendar",
  },
];

export function ModulesStrip() {
  return (
    <section className="border-y border-brand-ink/8 bg-[#1a1714] py-16 text-white md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-bold tracking-[0.18em] text-brand-primary uppercase">
          Todo en un solo sistema
        </p>
        <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold tracking-tight md:text-4xl">
          Lo que usás todos los días — no un puñado de pantallas sueltas
        </h2>
        <p className="mt-3 max-w-xl text-base text-white/60">
          Operación, equipo, stock y presencia web. Pensado para salones en
          Nicaragua que cobran por transferencia y viven del ritmo del piso.
        </p>

        <div className="mt-12 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex gap-3"
              >
                <Icon
                  className="mt-0.5 shrink-0 text-brand-primary"
                  size={22}
                  strokeWidth={1.75}
                />
                <div>
                  <h3 className="font-serif text-xl font-semibold">{m.title}</h3>
                  <p className="mt-1 text-sm text-white/55">{m.text}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
