"use client";

import { motion } from "framer-motion";
import {
  ShotAgenda,
  ShotAgendar,
  ShotCaja,
  ShotComisiones,
  ShotDashboard,
  ShotInventario,
  ShotPiso,
  ShotSitio,
  ShotTablero,
} from "@/components/landing/FeatureMockups";

const features = [
  {
    eyebrow: "Panel del día",
    title: "Sabés cómo va el salón de un vistazo",
    text: "Ingresos, citas de hoy, pendientes y lo que más se vende — sin abrir cinco chats ni un Excel.",
    bullets: [
      "KPIs del día en la home del admin",
      "Próximas citas a la mano",
      "Base para decidir turnos y stock",
    ],
    shot: "dashboard" as const,
    reverse: false,
  },
  {
    eyebrow: "Agenda online",
    title: "Tu calendario, claro desde cualquier lugar",
    text: "Ves citas del día, la semana y el mes. Menos mensajes perdidos, más sillas ocupadas.",
    bullets: [
      "Vista mes y semana con citas a color",
      "Asigná profesional y estado en un clic",
      "Acceso desde la oficina o desde casa",
    ],
    shot: "agenda" as const,
    reverse: true,
  },
  {
    eyebrow: "Tablero del piso",
    title: "Recepción y estilistas, alineados en vivo",
    text: "Pendiente → espera → atendiendo → concluido. Cuando llega una cita nueva, el piso se entera.",
    bullets: [
      "Kanban por estado del servicio",
      "WhatsApp: confirmar o recordar con un toque",
      "Ideal para horas pico",
    ],
    shot: "tablero" as const,
    reverse: false,
  },
  {
    eyebrow: "Reserva online",
    title: "La clienta agenda desde tu sitio",
    text: "Elige servicio, profesional y hora. La reserva entra como cita Web en Pendiente — lista para confirmar.",
    bullets: [
      "Reserva 24/7 desde tu sitio Florece",
      "Cae directo al calendario y al tablero",
      "Después le escribís por WhatsApp desde el panel",
    ],
    shot: "agendar" as const,
    reverse: true,
  },
  {
    eyebrow: "Inventario inteligente",
    title: "Stock de vitrina e insumos, al día",
    text: "Retail e insumos internos (g/ml) por separado. Sabés qué está bajo mínimo antes de la hora pico.",
    bullets: [
      "Alertas cuando llega al mínimo",
      "Insumos ligados a la receta del servicio",
      "Historial de movimientos desde caja",
    ],
    shot: "inventario" as const,
    reverse: false,
  },
  {
    eyebrow: "Caja y POS",
    title: "Cobrás y el stock se actualiza solo",
    text: "Ticket con servicios y productos. Al cobrar, Florece descuenta los insumos de la receta.",
    bullets: [
      "Efectivo, transferencia o tarjeta",
      "Insumos a descontar en el ticket",
      "Total claro para cerrar en segundos",
    ],
    shot: "caja" as const,
    reverse: true,
  },
  {
    eyebrow: "Piso del estilista",
    title: "El equipo anota en el móvil",
    text: "Buscan la hoja, ven qué insumos usar y siguen su comisión del día. Caja cierra cuando cobrás.",
    bullets: [
      "Pantalla pensada para el piso",
      "Comisión del día a la vista",
      "Sin permiso para editar stock",
    ],
    shot: "piso" as const,
    reverse: false,
  },
  {
    eyebrow: "Comisiones",
    title: "Pagás al equipo sin pelear con Excel",
    text: "Porcentaje sobre servicios cobrados, pendiente vs confirmado, y cierre del período a la vista.",
    bullets: [
      "Comisiones por profesional",
      "El estilista ve lo suyo en el piso",
      "Dueño revisa y cierra el período",
    ],
    shot: "comisiones" as const,
    reverse: true,
  },
  {
    eyebrow: "Presencia web",
    title: "Tu salón online, con tu marca",
    text: "Sitio propio con servicios, equipo, Instagram y contacto — presencia que vende mientras operás.",
    bullets: [
      "Página pública del salón",
      "Catálogo e imágenes",
      "Listo para compartir en redes",
    ],
    shot: "sitio" as const,
    reverse: false,
  },
] as const;

const SHOTS = {
  dashboard: ShotDashboard,
  agenda: ShotAgenda,
  tablero: ShotTablero,
  agendar: ShotAgendar,
  inventario: ShotInventario,
  caja: ShotCaja,
  piso: ShotPiso,
  comisiones: ShotComisiones,
  sitio: ShotSitio,
} as const;

export function FeatureShowcase() {
  return (
    <section className="relative overflow-hidden border-y border-brand-ink/8 bg-white/50">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 20%, rgba(196,165,116,0.18), transparent 42%), radial-gradient(circle at 88% 70%, rgba(232,213,200,0.35), transparent 40%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.18em] text-brand-primary-dark uppercase">
            Cómo se ve Florece
          </p>
          <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
            No es solo agenda — es el salón completo
          </h2>
          <p className="mt-4 text-lg text-brand-text-muted">
            Panel, citas, tablero, reservas, inventario, caja, piso, comisiones
            y sitio web — todo el salón en un solo sistema.
          </p>
        </div>

        <div className="mt-16 space-y-20 md:space-y-28">
          {features.map((f) => {
            const Shot = SHOTS[f.shot];
            return (
              <motion.article
                key={f.eyebrow}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: 0.05 }}
                className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-14 ${
                  f.reverse ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-brand-primary-dark uppercase">
                    {f.eyebrow}
                  </p>
                  <h3 className="mt-2 font-serif text-3xl font-semibold tracking-tight md:text-[2rem] md:leading-tight">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-brand-text-muted">
                    {f.text}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {f.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex gap-2.5 text-sm text-brand-ink/80"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary-dark" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={f.shot === "piso" ? "flex justify-center" : ""}
                >
                  <Shot />
                </motion.div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
