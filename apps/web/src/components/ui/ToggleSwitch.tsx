"use client";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
};

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  id,
}: ToggleSwitchProps) {
  const switchId = id ?? `toggle-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p id={`${switchId}-label`} className="text-sm font-semibold text-brand-ink">
          {label}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-brand-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${switchId}-label`}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-brand-primary" : "bg-brand-ink/15"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 block h-6 w-6 rounded-full bg-white shadow-sm transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
