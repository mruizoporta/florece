"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { DEMO_SLUG } from "@florece/shared";
import { useLocale } from "@/components/LocaleProvider";
import { FloreceLogo } from "@/components/brand/FloreceLogo";

export function LandingHero() {
  const { tr } = useLocale();

  return (
    <section className="hero-glow relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -right-24 top-20 h-96 w-96 rounded-full bg-brand-primary/20 blur-3xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.55, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-brand-ink/5 blur-3xl"
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-16 pt-8">
        <header className="flex items-center justify-between">
          <FloreceLogo tone="ink" size="md" />
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/login"
              className="font-medium text-brand-text-muted transition-colors hover:text-brand-ink"
            >
              {tr("nav.login")}
            </Link>
            <Link href="/registrar-salon" className="btn-primary py-2 text-xs">
              {tr("nav.register")}
            </Link>
          </nav>
        </header>

        <div className="flex flex-1 flex-col justify-center py-16 lg:py-24">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary-dark"
          >
            {tr("hero.eyebrow")}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif max-w-3xl text-5xl font-medium leading-[1.08] text-brand-ink sm:text-6xl lg:text-7xl"
          >
            {tr("hero.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-brand-text-muted"
          >
            {tr("hero.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link href={`/s/${DEMO_SLUG}`} className="btn-primary">
              {tr("hero.cta.demo")}
            </Link>
            <Link href="/registrar-salon" className="btn-secondary">
              {tr("hero.cta.register")}
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="flex flex-wrap items-center gap-4 border-t border-brand-ink/8 pt-8 text-sm text-brand-text-muted sm:gap-8"
        >
          <span>{tr("booking.title")}</span>
          <span className="h-1 w-1 rounded-full bg-brand-primary" />
          <span>{tr("admin.dashboard")}</span>
          <span className="h-1 w-1 rounded-full bg-brand-primary" />
          <span>Multi-salón</span>
        </motion.div>
      </div>
    </section>
  );
}
