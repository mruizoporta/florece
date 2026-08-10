"use client";

import { useEffect, useId, useRef, useState } from "react";

export type ModernSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type ModernSelectProps = {
  label?: string;
  placeholder?: string;
  value: string;
  options: ModernSelectOption[];
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export function ModernSelect({
  label,
  placeholder = "Seleccionar…",
  value,
  options,
  onChange,
  required,
  disabled,
}: ModernSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {label ? <label className="label-field">{label}</label> : null}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-required={required}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left transition ${
          open
            ? "border-brand-primary shadow-[0_0_0_3px_rgba(196,165,116,0.28)]"
            : "border-brand-ink/10 hover:border-brand-ink/25"
        } disabled:opacity-50`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            selected
              ? "bg-brand-primary text-brand-ink"
              : "bg-brand-warm text-brand-text-muted"
          }`}
        >
          {selected ? selected.label.slice(0, 1).toUpperCase() : "?"}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate font-medium ${
              selected ? "text-brand-ink" : "text-brand-text-muted"
            }`}
          >
            {selected?.label ?? placeholder}
          </span>
          {selected?.description ? (
            <span className="mt-0.5 block truncate text-xs text-brand-text-muted">
              {selected.description}
            </span>
          ) : null}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-brand-text-muted transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-brand-ink/10 bg-white p-1.5 shadow-lg shadow-brand-ink/10"
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    isActive
                      ? "bg-brand-primary/25 text-brand-ink"
                      : "hover:bg-brand-warm"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isActive
                        ? "bg-brand-primary text-brand-ink"
                        : "bg-brand-mist text-brand-ink"
                    }`}
                  >
                    {opt.label.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {opt.label}
                    </span>
                    {opt.description ? (
                      <span className="block truncate text-xs text-brand-text-muted">
                        {opt.description}
                      </span>
                    ) : null}
                  </span>
                  {isActive ? (
                    <span className="text-xs font-semibold text-brand-primary-dark">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
          {options.length === 0 ? (
            <li className="px-3 py-4 text-sm text-brand-text-muted">
              Sin opciones
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
