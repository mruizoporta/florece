"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({
  className = "admin-header-action admin-header-icon",
}: {
  className?: string;
  /** @deprecated ignored — icons only */
  compact?: boolean;
}) {
  const { resolved, cyclePreference } = useTheme();
  const isDark = resolved === "dark";
  // Show the mode you'll switch to (less confusing than labeling current).
  const Icon = isDark ? Sun : Moon;
  const nextLabel = isDark ? "claro" : "oscuro";

  return (
    <button
      type="button"
      onClick={cyclePreference}
      className={className}
      title={`Cambiar a modo ${nextLabel}`}
      aria-label={`Cambiar a modo ${nextLabel}`}
    >
      <Icon size={15} strokeWidth={2} />
    </button>
  );
}
