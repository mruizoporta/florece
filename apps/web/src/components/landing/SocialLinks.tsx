"use client";

import { MessageCircle } from "lucide-react";
import { SITE } from "@/lib/site";

export type SocialId = "whatsapp" | "instagram" | "facebook";

export type SocialLink = {
  id: SocialId;
  label: string;
  href: string;
};

export function socialLinks(): SocialLink[] {
  return [
    { id: "whatsapp", label: "WhatsApp", href: SITE.whatsappUrl },
    { id: "instagram", label: "Instagram", href: SITE.instagramUrl },
    { id: "facebook", label: "Facebook", href: SITE.facebookUrl },
  ];
}

function SocialGlyph({ id }: { id: SocialId }) {
  if (id === "whatsapp") {
    return <MessageCircle size={18} strokeWidth={2.25} aria-hidden />;
  }
  if (id === "instagram") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill="currentColor"
        aria-hidden
      >
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="currentColor"
      aria-hidden
    >
      <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.5l.5-3H14V9z" />
    </svg>
  );
}

type Tone = "onDark" | "onLight";

const iconBtn: Record<Tone, string> = {
  onDark:
    "border-white/15 bg-white/8 text-white/85 hover:border-white/30 hover:bg-white/15 hover:text-white",
  onLight:
    "border-brand-ink/12 bg-white text-brand-ink hover:border-brand-ink/25 hover:bg-brand-warm",
};

export function SocialLinks({
  className = "",
  showLabels = false,
  tone = "onDark",
}: {
  className?: string;
  showLabels?: boolean;
  tone?: Tone;
}) {
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {socialLinks().map((s) => (
        <li key={s.id}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            title={s.label}
            className={`inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm font-semibold transition ${iconBtn[tone]} ${
              showLabels ? "pr-3" : ""
            }`}
          >
            <SocialGlyph id={s.id} />
            {showLabels ? <span>{s.label}</span> : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
