"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { BookingWizard } from "@/components/booking/BookingWizard";
import type { CatalogService, PublicEmployee, TenantSetting } from "@/lib/types";
import { logoUrl } from "@/lib/images";
import { salonThemeFromSetting, salonThemeStyle } from "@/lib/theme";

function BookingContent({
  slug,
  salonName,
  setting,
  services,
  employees,
}: {
  slug: string;
  salonName: string;
  setting: TenantSetting;
  services: CatalogService[];
  employees: PublicEmployee[];
}) {
  const { locale, toggle } = useLocale();
  const theme = salonThemeFromSetting(setting);
  const themeStyle = salonThemeStyle(theme);
  const logo = logoUrl(setting.logo);
  const currencySymbol = setting.currencySymbol?.trim() || "C$";

  return (
    <div
      className="salon-site booking-flow relative min-h-screen overflow-x-hidden antialiased"
      style={themeStyle}
    >
      <div className="booking-atmosphere pointer-events-none absolute inset-0" aria-hidden />

      <header className="relative z-20">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 pt-5 pb-2 sm:px-8 sm:pt-7">
          <Link
            href={`/s/${slug}`}
            className="group flex min-w-0 items-center gap-3.5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#1a1a1a]/55 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.04] transition group-hover:text-[#1a1a1a] group-hover:ring-black/10">
              <ArrowLeft size={17} strokeWidth={2} />
            </span>
            <div className="flex min-w-0 items-center gap-3">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-lg object-contain"
                />
              ) : null}
              <div className="min-w-0">
                <p className="salon-title truncate font-serif text-[1.65rem] leading-none font-medium tracking-tight sm:text-[1.85rem]">
                  {salonName}
                </p>
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={
              locale === "es" ? "Switch to English" : "Cambiar a español"
            }
            className="rounded-full bg-white/60 px-3.5 py-2 text-[11px] font-semibold tracking-[0.16em] text-[#1a1a1a]/55 uppercase shadow-[0_8px_24px_-18px_rgba(0,0,0,0.3)] ring-1 ring-black/[0.04] transition hover:bg-white hover:text-[#1a1a1a]"
          >
            {locale === "es" ? "EN" : "ES"}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-5 pt-6 pb-36 sm:px-8 sm:pt-8">
        <BookingWizard
          slug={slug}
          services={services}
          employees={employees}
          currencySymbol={currencySymbol}
        />
      </main>

      <style jsx global>{`
        .booking-flow {
          background: #f7f4f1;
          color: #1a1a1a;
        }
        .booking-atmosphere {
          background:
            radial-gradient(
              ellipse 90% 55% at 85% -10%,
              color-mix(in srgb, var(--salon-accent) 28%, transparent),
              transparent 58%
            ),
            radial-gradient(
              ellipse 55% 45% at -5% 70%,
              color-mix(in srgb, var(--salon-icon) 18%, transparent),
              transparent 55%
            ),
            radial-gradient(
              ellipse 40% 30% at 50% 100%,
              color-mix(in srgb, var(--salon-accent) 10%, transparent),
              transparent 60%
            ),
            linear-gradient(180deg, #faf8f6 0%, #f3efea 100%);
        }
        .booking-flow .salon-btn {
          background-color: var(--salon-accent);
          color: var(--salon-accent-text);
        }
        .booking-flow .salon-title {
          color: var(--salon-title);
        }
        .booking-flow .salon-check {
          background-color: var(--salon-accent);
          color: var(--salon-accent-text);
        }
        .booking-flow .salon-progress-on {
          background-color: var(--salon-accent);
        }
        .booking-flow .salon-selected {
          background: color-mix(in srgb, var(--salon-accent) 14%, white);
          box-shadow:
            inset 0 0 0 1.5px
              color-mix(in srgb, var(--salon-accent) 55%, transparent),
            0 18px 40px -28px
              color-mix(in srgb, var(--salon-accent) 55%, #1a1a1a);
        }
        .booking-flow .salon-slot-on {
          background-color: var(--salon-accent);
          color: var(--salon-accent-text);
          box-shadow: 0 12px 28px -16px
            color-mix(in srgb, var(--salon-accent) 80%, #1a1a1a);
        }
        .booking-flow .booking-input {
          background: rgba(255, 255, 255, 0.92);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.8) inset,
            0 14px 36px -28px rgba(26, 26, 26, 0.45),
            inset 0 0 0 1px rgba(26, 26, 26, 0.06);
        }
        .booking-flow .booking-input:focus {
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.8) inset,
            0 18px 40px -24px
              color-mix(in srgb, var(--salon-accent) 45%, #1a1a1a),
            inset 0 0 0 2px
              color-mix(in srgb, var(--salon-accent) 70%, transparent);
        }
        @keyframes bookingFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bookingScaleIn {
          from {
            opacity: 0;
            transform: scale(0.94);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bookingBarGrow {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        .booking-step-enter {
          animation: bookingFadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .booking-row {
          animation: bookingFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .booking-success-pop {
          animation: bookingScaleIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  );
}

export function BookingPageClient({
  slug,
  salonName,
  setting,
  services,
  employees,
}: {
  slug: string;
  salonName: string;
  setting: TenantSetting;
  services: CatalogService[];
  employees: PublicEmployee[];
}) {
  return (
    <BookingContent
      slug={slug}
      salonName={salonName}
      setting={setting}
      services={services}
      employees={employees}
    />
  );
}
