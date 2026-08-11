import type { HTMLAttributes } from "react";

type Tone = "ink" | "onDark" | "gold";

const tones = {
  ink: { mark: "#c4a574", markDeep: "#6b5638", word: "#161412" },
  onDark: { mark: "#c4a574", markDeep: "#e8d5c8", word: "#ffffff" },
  gold: { mark: "#c4a574", markDeep: "#b39463", word: "#c4a574" },
} as const;

function BloomMark({
  className,
  mark,
  markDeep,
}: {
  className?: string;
  mark: string;
  markDeep: string;
}) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden>
      <g fill={mark}>
        <path d="M40 12c2.8 8.5 3.6 17.8 2.2 27.2-1.1 7.4-3.6 13.8-7.2 19.2 4.8-2.2 8.2-6.4 9.6-12.2C48.2 33.6 46.4 22.2 40 12z" />
        <path d="M40 12c-2.8 8.5-3.6 17.8-2.2 27.2 1.1 7.4 3.6 13.8 7.2 19.2-4.8-2.2-8.2-6.4-9.6-12.2C31.8 33.6 33.6 22.2 40 12z" />
        <path d="M26 18c6.2 7.4 10.8 16.2 12.4 25.4.8 4.8.6 9.2-.4 13.2 3.2-3.4 4.8-8 4.2-13.4-1.4-10.4-6.6-19.8-16.2-25.2z" />
        <path d="M54 18c-6.2 7.4-10.8 16.2-12.4 25.4-.8 4.8-.6 9.2.4 13.2-3.2-3.4-4.8-8-4.2-13.4 1.4-10.4 6.6-19.8 16.2-25.2z" />
        <path d="M14 30c8.4 4.2 15.2 10.8 19.4 18.6 2.2 4 3.4 8 3.8 11.8-4.2-1.4-8-4.2-10.8-8.2C21.4 45.2 16.6 36.8 14 30z" />
        <path d="M66 30c-8.4 4.2-15.2 10.8-19.4 18.6-2.2 4-3.4 8-3.8 11.8 4.2-1.4 8-4.2 10.8-8.2C58.6 45.2 63.4 36.8 66 30z" />
      </g>
      <path
        fill={markDeep}
        d="M40 52c-3.2 3.6-5.2 7.2-5.8 10.8-.4 2.2.2 4 1.4 5.4 1.8-2.8 3.2-5.8 4.4-9.2 1.2 3.4 2.6 6.4 4.4 9.2 1.2-1.4 1.8-3.2 1.4-5.4-.6-3.6-2.6-7.2-5.8-10.8z"
      />
      <circle cx="40" cy="50" r="2.6" fill={markDeep} />
    </svg>
  );
}

type FloreceLogoProps = HTMLAttributes<HTMLElement> & {
  variant?: "lockup" | "mark" | "word" | "badge";
  tone?: Tone;
  /** Text size driving mark height (lockup uses em) */
  size?: "sm" | "md" | "lg" | "hero";
};

const sizeClass = {
  sm: "text-lg gap-1.5",
  md: "text-[1.65rem] gap-2",
  lg: "text-3xl gap-2.5",
  hero: "text-[clamp(3.4rem,12vw,7.2rem)] gap-3 md:gap-4",
} as const;

const markSizeClass = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  hero: "h-16 w-16",
} as const;

export function FloreceLogo({
  variant = "lockup",
  tone = "ink",
  size = "md",
  className = "",
  ...rest
}: FloreceLogoProps) {
  const c = tones[tone];

  if (variant === "badge") {
    return (
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-[#b89468] shadow-[0_10px_24px_-14px_rgba(196,165,116,0.9)] ${className}`}
        {...rest}
      >
        <BloomMark
          className="h-6 w-6"
          mark="#161412"
          markDeep="#3d3228"
        />
      </span>
    );
  }

  if (variant === "mark") {
    return (
      <span className={`inline-flex ${className}`} {...rest}>
        <BloomMark
          className={`${markSizeClass[size]} shrink-0`}
          mark={c.mark}
          markDeep={c.markDeep}
        />
      </span>
    );
  }

  if (variant === "word") {
    return (
      <span
        className={`font-serif font-semibold tracking-tight leading-none ${sizeClass[size]} ${className}`}
        style={{ color: c.word }}
        {...rest}
      >
        Florece
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-serif font-semibold tracking-tight leading-none ${sizeClass[size]} ${className}`}
      style={{ color: c.word }}
      {...rest}
    >
      <BloomMark
        className="h-[0.92em] w-[0.92em] shrink-0"
        mark={c.mark}
        markDeep={c.markDeep}
      />
      <span>Florece</span>
    </span>
  );
}
