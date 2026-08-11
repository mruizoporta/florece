"use client";

import Image from "next/image";
import type { ReactNode } from "react";

function BrowserChrome({
  children,
  url,
}: {
  children: ReactNode;
  url: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-ink/10 bg-white shadow-[0_28px_60px_-28px_rgba(22,20,18,0.45)]">
      <div className="flex items-center gap-2 border-b border-brand-ink/8 bg-[#f3efe7] px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#e8a0a0]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e8d08a]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#a8d4a8]" />
        <div className="ml-2 flex-1 truncate rounded-md bg-white/80 px-2.5 py-1 text-[10px] text-brand-ink/45">
          {url}
        </div>
      </div>
      <div className="relative bg-[#fbfaf7]">{children}</div>
    </div>
  );
}

function PhoneChrome({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[2rem] border-[3px] border-[#2a241c] bg-[#1a1714] shadow-[0_28px_60px_-28px_rgba(22,20,18,0.55)]">
      <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-black/40" />
      <div className="relative m-2 overflow-hidden rounded-[1.4rem] bg-[#f5f2ee]">
        {children}
      </div>
    </div>
  );
}

type ShotProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  url: string;
};

function DesktopShot({ src, alt, width, height, url }: ShotProps) {
  return (
    <BrowserChrome url={url}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-auto w-full"
        sizes="(max-width: 1024px) 100vw, 560px"
        priority={false}
      />
    </BrowserChrome>
  );
}

export function ShotDashboard() {
  return (
    <DesktopShot
      src="/marketing/dashboard.png"
      alt="Panel Florece — ingresos del día, citas y actividad del salón"
      width={1184}
      height={832}
      url="floreceapp.com/s/demo/admin"
    />
  );
}

export function ShotAgenda() {
  return (
    <DesktopShot
      src="/marketing/agenda.png"
      alt="Calendario de citas en Florece — vista mes con turnos del día"
      width={1184}
      height={832}
      url="floreceapp.com/s/demo/admin/calendar"
    />
  );
}

export function ShotTablero() {
  return (
    <DesktopShot
      src="/marketing/tablero.png"
      alt="Tablero del piso en Florece — citas por estado en tiempo real"
      width={1184}
      height={832}
      url="floreceapp.com/s/demo/admin/board"
    />
  );
}

export function ShotInventario() {
  return (
    <DesktopShot
      src="/marketing/inventario.png"
      alt="Catálogo e inventario en Florece — productos, stock y uso vitrina o insumo"
      width={1184}
      height={832}
      url="floreceapp.com/s/demo/admin/catalog"
    />
  );
}

export function ShotCaja() {
  return (
    <DesktopShot
      src="/marketing/caja.png"
      alt="Ticket de caja en Florece — total cobrado e ítems del servicio"
      width={1184}
      height={832}
      url="floreceapp.com/s/demo/admin/orders"
    />
  );
}

export function ShotComisiones() {
  return (
    <DesktopShot
      src="/marketing/comisiones.png"
      alt="Comisiones del equipo en Florece — período y montos por profesional"
      width={1184}
      height={832}
      url="floreceapp.com/s/demo/admin/payroll"
    />
  );
}

export function ShotSitio() {
  return (
    <DesktopShot
      src="/marketing/sitio.png"
      alt="Sitio público del salón en Florece — marca, servicios y contacto"
      width={1440}
      height={900}
      url="floreceapp.com/s/demo"
    />
  );
}

export function ShotAgendar() {
  return (
    <DesktopShot
      src="/marketing/agendar.png"
      alt="Reserva online en Florece — la clienta elige servicio y horario"
      width={768}
      height={824}
      url="floreceapp.com/s/demo/agendar"
    />
  );
}

export function ShotPiso() {
  return (
    <PhoneChrome>
      <Image
        src="/marketing/piso.png"
        alt="Piso del estilista en Florece — comisión del día y hojas abiertas"
        width={780}
        height={1542}
        className="h-auto w-full"
        sizes="280px"
        priority={false}
      />
    </PhoneChrome>
  );
}
