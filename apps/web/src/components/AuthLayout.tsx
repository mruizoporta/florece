"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Users, Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLocale } from "@/components/LocaleProvider";
import { FloreceLogo } from "@/components/brand/FloreceLogo";

const FEATURES = [
  { Icon: CalendarDays, key: "login.feature.agenda" },
  { Icon: Wallet, key: "login.feature.cash" },
  { Icon: Users, key: "login.feature.team" },
] as const;

/** Pantalla dividida para login y recuperar contraseña: foto a la izquierda, formulario a la derecha. */
export function AuthLayout({
  title,
  hint,
  children,
  footer,
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { tr } = useLocale();

  return (
    <div className="grid min-h-[100svh] bg-brand-base lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="/demo/site/left.jpg"
          alt=""
          fill
          priority
          sizes="55vw"
          className="object-cover object-[60%_30%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,#12100e_8%,rgba(18,16,14,0.7)_45%,rgba(18,16,14,0.15)_100%)]" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white xl:p-14">
          <Link href="/" className="inline-flex w-fit" aria-label="Florece">
            <FloreceLogo tone="onDark" size="lg" />
          </Link>
          <div className="max-w-lg">
            <p className="font-serif text-4xl leading-[1.1] font-medium xl:text-5xl">
              {tr("login.panelTitle")}
            </p>
            <p className="mt-4 text-base leading-relaxed text-white/70">{tr("login.panelHint")}</p>
            <ul className="mt-8 flex flex-wrap gap-2.5">
              {FEATURES.map(({ Icon, key }) => (
                <li
                  key={key}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-sm text-white/90 backdrop-blur-md"
                >
                  <Icon className="h-4 w-4 text-brand-primary" aria-hidden />
                  {tr(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <main className="flex flex-col px-5 py-5 sm:px-10 sm:py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex lg:invisible" aria-label="Florece">
            <FloreceLogo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-brand-ink/10 bg-brand-elevated text-brand-ink transition hover:bg-brand-mist" />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
            {title}
          </h1>
          {hint ? <p className="mt-2.5 text-sm leading-relaxed text-brand-text-muted">{hint}</p> : null}
          {children}
        </div>

        {footer ? <div className="text-center text-xs text-brand-text-muted">{footer}</div> : null}
      </main>
    </div>
  );
}
