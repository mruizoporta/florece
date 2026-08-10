"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import type {
  CatalogProduct,
  CatalogService,
  InstagramFeed,
  PublicEmployee,
  Sponsor,
  TenantSection,
  TenantSetting,
} from "@/lib/types";
import {
  bannerUrl,
  employeeImageUrl,
  imageUrl,
  isPlaceholderAsset,
  itemImageUrl,
  logoUrl,
} from "@/lib/images";
import { salonThemeFromSetting, salonThemeStyle } from "@/lib/theme";
import { formatCurrency } from "@/lib/format";
import { HelpAssistant } from "@/components/assistant/HelpAssistant";

function ScissorsIcon({ className = "h-14 w-14" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.25}
        d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
      />
    </svg>
  );
}

function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function formatPrice(symbol: string | undefined, price: number | string) {
  return formatCurrency(
    typeof price === "number" ? price : Number(price),
    symbol?.trim() || "C$",
  );
}

function SalonContent({
  slug,
  name,
  setting,
  section,
  services,
  products,
  employees,
  sponsors,
  instagramFeeds,
  isDemo,
}: {
  slug: string;
  name: string;
  setting: TenantSetting;
  section: TenantSection;
  services: CatalogService[];
  products: CatalogProduct[];
  employees: PublicEmployee[];
  sponsors: Sponsor[];
  instagramFeeds: InstagramFeed[];
  isDemo: boolean;
}) {
  const { tr, locale, toggle } = useLocale();
  const [scrolled, setScrolled] = useState(false);

  const company = setting.companyName ?? name;
  const logo = logoUrl(setting.logo);
  const banner = bannerUrl(setting.banner);
  const imageLeft = imageUrl("left", setting.imageLeft);
  const imageRight = imageUrl("right", setting.imageRight);
  const imageParallax = imageUrl("parallax", setting.imageParallax);
  const theme = salonThemeFromSetting(setting);
  const themeStyle = salonThemeStyle(theme);
  const whatsappNumber = setting.whatsapp?.replace(/\D/g, "") ?? "";
  const bookingOn = setting.activeAppointment !== false;
  const showWhatsapp = section.whatsappShowSection !== false && whatsappNumber.length > 0;
  const showServices = section.servicesShowSection !== false && services.length > 0;
  const showProducts = section.productsShowSection !== false && products.length > 0;
  const showEmployees = section.employeesShowSection !== false && employees.length > 0;
  const showInstagram = section.instagramShowSection !== false && instagramFeeds.length > 0;
  const showAbout = section.aboutUsShowSection !== false && Boolean(setting.aboutUs?.trim());
  const aboutText = setting.aboutUs?.replace(/<[^>]+>/g, "").trim() ?? "";
  const heroLine =
    aboutText.length > 140 ? `${aboutText.slice(0, 140).trim()}…` : aboutText;
  const bookHref = `/s/${slug}/agendar`;

  /** Custom section titles are usually Spanish; use i18n when viewing EN. */
  const servicesLabel =
    locale === "en"
      ? tr("salon.services")
      : section.servicesText || tr("salon.services");
  const productsLabel =
    locale === "en"
      ? tr("salon.products")
      : section.productsText || tr("salon.products");
  const teamLabel =
    locale === "en"
      ? tr("salon.team")
      : section.employeesText || tr("salon.team");
  const aboutLabel =
    locale === "en"
      ? tr("salon.about")
      : section.aboutUsText || tr("salon.about");
  const instagramLabel =
    locale === "en"
      ? tr("salon.instagram")
      : section.instagramText || tr("salon.instagram");
  const navServices = tr("salon.nav.services");
  const navProducts = tr("salon.nav.products");
  const navTeam = tr("salon.nav.team");

  const navTop = isDemo ? "top-[52px]" : "top-0";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="salon-site min-h-screen scroll-smooth bg-[#fafafa] text-[#1a1a1a] antialiased"
      style={themeStyle}
    >
      {isDemo && (
        <div className="fixed left-0 right-0 top-0 z-[60] flex flex-wrap items-center justify-center gap-3 border-b border-black/5 bg-[#111]/95 px-4 py-2.5 text-center text-sm text-white backdrop-blur-md">
          <span className="font-medium opacity-90">{tr("demo.banner")}</span>
          <Link
            href="/registrar-salon"
            className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-xs font-semibold tracking-wide text-[#111] transition hover:bg-white/90"
          >
            {tr("demo.cta")}
          </Link>
        </div>
      )}

      <nav
        className={`fixed ${navTop} left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-black/5 bg-[#fafafa]/90 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)] backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex h-[4.25rem] items-center justify-between gap-4 lg:h-20">
            <Link href={`/s/${slug}`} className="flex min-w-0 items-center gap-3">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt=""
                  className="h-9 w-9 shrink-0 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
              <span
                className={`truncate font-serif text-2xl font-medium tracking-tight transition-colors duration-500 sm:text-[1.65rem] ${
                  scrolled ? "salon-title" : "text-white"
                }`}
              >
                {company}
              </span>
            </Link>

            <div className="hidden flex-1 items-center justify-end gap-9 md:flex">
              {showServices && (
                <a
                  href="#servicios"
                  className={`text-[13px] font-medium tracking-wide transition hover:opacity-100 ${
                    scrolled
                      ? "text-[#1a1a1a]/55 hover:text-[#1a1a1a]"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  {navServices}
                </a>
              )}
              {showProducts && (
                <a
                  href="#productos"
                  className={`text-[13px] font-medium tracking-wide transition hover:opacity-100 ${
                    scrolled
                      ? "text-[#1a1a1a]/55 hover:text-[#1a1a1a]"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  {navProducts}
                </a>
              )}
              {showEmployees && (
                <a
                  href="#equipo"
                  className={`text-[13px] font-medium tracking-wide transition hover:opacity-100 ${
                    scrolled
                      ? "text-[#1a1a1a]/55 hover:text-[#1a1a1a]"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  {navTeam}
                </a>
              )}
              {bookingOn ? (
                <Link
                  href={bookHref}
                  className="salon-btn inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold tracking-wide transition hover:brightness-95"
                >
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  {tr("salon.book")}
                </Link>
              ) : null}
              <button
                type="button"
                onClick={toggle}
                aria-label={locale === "es" ? "Switch to English" : "Cambiar a español"}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                  scrolled
                    ? "bg-black/5 text-[#1a1a1a]/70 hover:bg-black/10"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {locale === "es" ? "EN" : "ES"}
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-2.5 sm:gap-3 md:hidden">
              <button
                type="button"
                onClick={toggle}
                aria-label={locale === "es" ? "Switch to English" : "Cambiar a español"}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                  scrolled
                    ? "bg-black/5 text-[#1a1a1a]/70"
                    : "bg-white/15 text-white"
                }`}
              >
                {locale === "es" ? "EN" : "ES"}
              </button>
              {bookingOn ? (
                <Link
                  href={bookHref}
                  className="salon-btn inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition hover:brightness-95"
                >
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  {tr("salon.bookShort")}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero — full bleed */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden">
        <div className="absolute inset-0">
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner}
              alt=""
              className="salon-hero-media h-full w-full object-cover"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: `
                  radial-gradient(ellipse 70% 55% at 75% 35%, color-mix(in srgb, var(--salon-accent) 35%, transparent), transparent 60%),
                  radial-gradient(ellipse 50% 40% at 15% 80%, color-mix(in srgb, var(--salon-icon) 28%, transparent), transparent 55%),
                  linear-gradient(160deg, #1c1c1c 0%, #2a2a2a 45%, #171717 100%)
                `,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/25" />
        </div>

        <div
          className={`relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-36 sm:px-8 sm:pb-20 lg:pb-24 ${
            isDemo ? "pt-[calc(9rem+52px)]" : ""
          }`}
        >
          <div className="max-w-3xl animate-fade-up">
            <h1 className="font-serif text-[clamp(2.75rem,8vw,5.5rem)] font-medium leading-[0.95] tracking-tight text-white">
              {company}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl animate-fade-up-delay">
              {heroLine || tr("salon.heroFallback")}
            </p>
            {bookingOn ? (
              <div className="mt-10 animate-fade-up-delay-2">
                <Link
                  href={bookHref}
                  className="salon-btn inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold tracking-wide shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] transition hover:brightness-95"
                >
                  <CalendarIcon />
                  {tr("salon.book")}
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 sm:block">
          <div className="salon-scroll-hint h-10 w-px bg-gradient-to-b from-white/0 via-white/60 to-white/0" />
        </div>
      </section>

      {showAbout && (
        <section id="nosotros" className="px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1a1a1a]/40">
                  {aboutLabel}
                </p>
                <h2 className="salon-title font-serif text-4xl font-medium leading-tight sm:text-5xl">
                  {company}
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-[#1a1a1a]/65 sm:text-xl sm:leading-relaxed">
                  {aboutText}
                </p>
                {setting.schedules ? (
                  <p className="mt-8 border-l-2 border-[var(--salon-accent)] pl-5 text-sm leading-relaxed text-[#1a1a1a]/55 whitespace-pre-line">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]/40">
                      {tr("salon.hours")}
                    </span>
                    {setting.schedules}
                  </p>
                ) : null}
              </div>
              {(imageLeft || imageRight) && (
                <div className="grid grid-cols-2 gap-3 lg:col-span-7 lg:gap-5">
                  <div className="overflow-hidden bg-[#eceae6] aspect-[4/5]">
                    {imageLeft ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageLeft}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="mt-8 overflow-hidden bg-[#eceae6] aspect-[4/5] sm:mt-12">
                    {imageRight ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageRight}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {imageParallax ? (
        <section className="relative h-[42vh] min-h-[240px] overflow-hidden sm:h-[52vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageParallax}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/25" />
        </section>
      ) : null}

      {showServices && (
        <section id="servicios" className="bg-white px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1a1a1a]/40">
                {tr("salon.nav.services")}
              </p>
              <h2 className="salon-title font-serif text-4xl font-medium leading-tight sm:text-5xl">
                {servicesLabel}
              </h2>
              <p className="mt-4 text-lg text-[#1a1a1a]/55">{tr("salon.servicesSubtitle")}</p>
            </div>

            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s, i) => {
                const img = itemImageUrl(s.item?.image ?? (s as { image?: string }).image);
                return (
                  <article
                    key={s.id}
                    className="group flex flex-col"
                    style={{ animationDelay: `${Math.min(i, 5) * 60}ms` }}
                  >
                    <div className="relative mb-5 aspect-[4/3] overflow-hidden bg-[#eceae6]">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={s.name}
                          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ScissorsIcon className="salon-icon h-12 w-12 opacity-40" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="mb-1 flex items-baseline justify-between gap-3">
                        <h3 className="font-serif text-2xl font-medium tracking-tight text-[#1a1a1a]">
                          {s.name}
                        </h3>
                        <span className="salon-icon shrink-0 text-sm font-semibold tabular-nums">
                          {formatPrice(setting.currencySymbol, s.price)}
                        </span>
                      </div>
                      <p className="mb-5 text-sm text-[#1a1a1a]/45">
                        {s.durationTime} {tr("salon.min")}
                      </p>
                      {bookingOn ? (
                        <Link
                          href={`${bookHref}?service=${s.id}`}
                          className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[#1a1a1a] transition group-hover:gap-3"
                        >
                          {tr("salon.book")}
                          <span
                            className="inline-block h-px w-6 bg-[var(--salon-accent)] transition-all group-hover:w-10"
                            aria-hidden
                          />
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {showEmployees && (
        <section id="equipo" className="px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1a1a1a]/40">
                {tr("salon.nav.team")}
              </p>
              <h2 className="salon-title font-serif text-4xl font-medium leading-tight sm:text-5xl">
                {teamLabel}
              </h2>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              {employees.map((e) => {
                const img = employeeImageUrl(e.image);
                return (
                  <div key={e.id} className="group">
                    <div className="relative mb-5 aspect-[3/4] overflow-hidden bg-[#eceae6]">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={e.name}
                          className="h-full w-full object-cover object-top transition duration-700 ease-out group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="salon-icon font-serif text-5xl font-medium">
                            {e.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-serif text-2xl font-medium tracking-tight text-[#1a1a1a]">
                      {e.name}
                    </h3>
                    {e.description ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-[#1a1a1a]/50">
                        {e.description}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {showProducts && (
        <section id="productos" className="bg-white px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1a1a1a]/40">
                {tr("salon.nav.products")}
              </p>
              <h2 className="salon-title font-serif text-4xl font-medium leading-tight sm:text-5xl">
                {productsLabel}
              </h2>
              <p className="mt-4 text-lg text-[#1a1a1a]/55">{tr("salon.productsSubtitle")}</p>
            </div>
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => {
                const img = itemImageUrl(p.item?.image ?? (p as { image?: string }).image);
                return (
                  <article key={p.id} className="group">
                    <div className="relative mb-4 aspect-square overflow-hidden bg-[#eceae6]">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={p.name}
                          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ScissorsIcon className="salon-icon h-10 w-10 opacity-40" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-[#1a1a1a]">{p.name}</h3>
                    <p className="salon-icon mt-1 text-sm font-semibold">
                      {formatPrice(setting.currencySymbol, p.price)}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {showInstagram && (
        <section className="px-5 py-24 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1a1a1a]/40">
                  Instagram
                </p>
                <h2 className="salon-title font-serif text-4xl font-medium sm:text-5xl">
                  {instagramLabel}
                </h2>
              </div>
              {setting.instagramHref ? (
                <a
                  href={setting.instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a1a1a]/70 transition hover:text-[#1a1a1a]"
                >
                  <InstagramIcon className="h-4 w-4" />
                  {tr("salon.followUs")}
                </a>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {instagramFeeds.map((feed) => (
                <div
                  key={feed.id}
                  className="overflow-hidden bg-white [&_iframe]:!max-w-full"
                  dangerouslySetInnerHTML={{ __html: feed.content }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {sponsors.length > 0 && (
        <section className="border-y border-black/5 bg-[#f7f5f1] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1a1a1a]/40">
                {tr("salon.sponsors")}
              </p>
              <h2 className="font-serif text-2xl font-medium text-[#1a1a1a] sm:text-3xl">
                {tr("salon.sponsorsTitle")}
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {sponsors.map((s) => {
                const src =
                  s.image && !isPlaceholderAsset(s.image) ? s.image : null;
                const card = (
                  <div className="flex h-20 w-[9.5rem] items-center justify-center rounded-2xl border border-black/8 bg-white px-4 py-3 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)] sm:h-24 sm:w-44">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={s.name}
                        className="max-h-12 w-full object-contain sm:max-h-14"
                      />
                    ) : (
                      <span className="text-center text-sm font-semibold tracking-wide text-[#1a1a1a]/70">
                        {s.name}
                      </span>
                    )}
                  </div>
                );
                if (s.href) {
                  return (
                    <a
                      key={s.id}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:-translate-y-0.5 hover:opacity-95"
                    >
                      {card}
                    </a>
                  );
                }
                return <div key={s.id}>{card}</div>;
              })}
            </div>
          </div>
        </section>
      )}

      {bookingOn ? (
        <section className="relative overflow-hidden px-5 py-28 sm:px-8 lg:py-36">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 60% 80% at 80% 50%, color-mix(in srgb, var(--salon-accent) 22%, transparent), transparent 70%),
                #111111
              `,
            }}
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-4xl font-medium leading-tight text-white sm:text-5xl lg:text-6xl">
              {tr("salon.cta.title")}
            </h2>
            <p className="mx-auto mt-5 max-w-md text-lg text-white/60">{tr("salon.cta.sub")}</p>
            <Link
              href={bookHref}
              className="salon-btn mt-10 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-10 py-4 text-sm font-semibold tracking-wide transition hover:brightness-95"
            >
              <CalendarIcon />
              {tr("salon.book")}
            </Link>
          </div>
        </section>
      ) : null}

      <footer
        className="w-full"
        style={{
          backgroundColor: "var(--salon-footer-bg)",
          color: "var(--salon-footer-text)",
        }}
      >
        <div className="mx-auto w-full max-w-6xl px-5 pb-10 pt-16 sm:px-8 lg:pt-20">
          <div className="salon-footer-grid w-full">
            <div className="min-w-0">
              <Link
                href={`/s/${slug}`}
                className="flex items-center gap-3 transition hover:opacity-90"
                style={{ color: "var(--salon-footer-text)" }}
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt=""
                    className="h-10 w-10 shrink-0 object-contain opacity-90"
                  />
                ) : null}
                <span className="font-serif text-2xl font-medium tracking-tight">
                  {company}
                </span>
              </Link>
              {aboutText ? (
                <p className="mt-5 max-w-sm text-sm leading-relaxed opacity-55">
                  {aboutText.length > 140 ? `${aboutText.slice(0, 140)}…` : aboutText}
                </p>
              ) : null}
              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                {setting.instagramHref ? (
                  <a
                    href={setting.instagramHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 opacity-80 transition hover:opacity-100"
                    aria-label="Instagram"
                    style={{ color: "var(--salon-footer-text)" }}
                  >
                    <InstagramIcon className="h-4 w-4" />
                  </a>
                ) : null}
                {whatsappNumber ? (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 opacity-80 transition hover:opacity-100"
                    aria-label="WhatsApp"
                    style={{ color: "var(--salon-footer-text)" }}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                ) : null}
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] opacity-40">
                {tr("salon.footer.explore")}
              </p>
              <ul className="space-y-3 text-sm opacity-75">
                {showServices && (
                  <li>
                    <a href="#servicios" className="transition hover:opacity-100">
                      {navServices}
                    </a>
                  </li>
                )}
                {showProducts && (
                  <li>
                    <a href="#productos" className="transition hover:opacity-100">
                      {navProducts}
                    </a>
                  </li>
                )}
                {showEmployees && (
                  <li>
                    <a href="#equipo" className="transition hover:opacity-100">
                      {navTeam}
                    </a>
                  </li>
                )}
                {bookingOn && (
                  <li>
                    <Link href={bookHref} className="transition hover:opacity-100">
                      {tr("salon.book")}
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            <div className="min-w-0">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] opacity-40">
                {tr("salon.footer.contact")}
              </p>
              <ul className="space-y-3.5 text-sm opacity-75">
                {(setting.address || setting.location) && (
                  <li>{[setting.address, setting.location].filter(Boolean).join(" · ")}</li>
                )}
                {setting.phone && (
                  <li>
                    <a
                      href={`tel:${setting.phone.replace(/\s+/g, "")}`}
                      className="transition hover:opacity-100"
                    >
                      {setting.phone}
                    </a>
                  </li>
                )}
                {setting.mailContact && (
                  <li>
                    <a
                      href={`mailto:${setting.mailContact}`}
                      className="transition hover:opacity-100"
                    >
                      {setting.mailContact}
                    </a>
                  </li>
                )}
                {setting.schedules && (
                  <li>
                    <p className="mb-1 text-[11px] uppercase tracking-[0.18em] opacity-50">
                      {tr("salon.hours")}
                    </p>
                    <p className="whitespace-pre-line leading-relaxed">{setting.schedules}</p>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-sm opacity-40 sm:flex-row">
            <p>
              © {new Date().getFullYear()} {company}
            </p>
            <p>
              {tr("salon.madeWith")}{" "}
              <Link href="/" className="opacity-80 transition hover:opacity-100">
                Florece
              </Link>
            </p>
          </div>
        </div>
      </footer>

      <HelpAssistant
        context="salon"
        slug={slug}
        offsetRight={showWhatsapp}
        whatsappUrl={
          whatsappNumber
            ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(section.whatsappTitle1 ?? "Hola")}`
            : undefined
        }
      />

      {showWhatsapp && (
        <a
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(section.whatsappTitle1 ?? "Hola")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="salon-wa fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_12px_32px_-8px_rgba(0,0,0,0.45)] transition-transform hover:scale-105"
          style={{
            backgroundColor: "var(--salon-wa-bg)",
            color: "var(--salon-wa-text)",
          }}
          aria-label="WhatsApp"
        >
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}

      <style>{`
        .salon-site .salon-btn {
          background-color: var(--salon-accent);
          color: var(--salon-accent-text);
        }
        .salon-site .salon-title {
          color: var(--salon-title);
        }
        .salon-site .salon-icon {
          color: var(--salon-icon);
        }
        .salon-hero-media {
          animation: salon-kenburns 22s ease-out forwards;
          transform-origin: center center;
        }
        @keyframes salon-kenburns {
          from { transform: scale(1); }
          to { transform: scale(1.06); }
        }
        .salon-scroll-hint {
          animation: salon-pulse-line 2.2s ease-in-out infinite;
        }
        @keyframes salon-pulse-line {
          0%, 100% { opacity: 0.25; transform: scaleY(0.7); }
          50% { opacity: 0.9; transform: scaleY(1); }
        }
        .salon-wa {
          animation: salon-wa-in 0.6s ease-out 0.8s both;
        }
        @keyframes salon-wa-in {
          from { opacity: 0; transform: translateY(12px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .salon-footer-grid {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          width: 100%;
        }
        @media (min-width: 768px) {
          .salon-footer-grid {
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
            gap: 3rem;
          }
          .salon-footer-grid > * {
            flex: 1 1 0;
            min-width: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .salon-hero-media,
          .salon-scroll-hint,
          .salon-wa {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export function SalonPublicClient({
  slug,
  name,
  setting,
  section,
  services,
  products,
  employees,
  sponsors,
  instagramFeeds,
  isDemo = slug === "demo",
}: {
  slug: string;
  name: string;
  setting: TenantSetting;
  section: TenantSection;
  services: CatalogService[];
  products: CatalogProduct[];
  employees: PublicEmployee[];
  sponsors: Sponsor[];
  instagramFeeds: InstagramFeed[];
  isDemo?: boolean;
}) {
  return (
    <SalonContent
      slug={slug}
      name={name}
      setting={setting}
      section={section}
      services={services}
      products={products}
      employees={employees}
      sponsors={sponsors}
      instagramFeeds={instagramFeeds}
      isDemo={isDemo}
    />
  );
}
