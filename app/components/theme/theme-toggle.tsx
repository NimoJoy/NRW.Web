"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (resolvedTheme ?? "light") : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-1 text-xs font-semibold text-[color:var(--muted)] shadow-[var(--soft-shadow)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)]"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <span
        className={`rounded-full px-3 py-1 transition ${
          currentTheme === "light"
            ? "bg-[color:var(--primary)] text-[color:var(--primary-contrast)]"
            : "text-[color:var(--muted)]"
        }`}
      >
        Light
      </span>
      <span
        className={`rounded-full px-3 py-1 transition ${
          currentTheme === "dark"
            ? "bg-[color:var(--primary)] text-[color:var(--primary-contrast)]"
            : "text-[color:var(--muted)]"
        }`}
      >
        Dark
      </span>
    </button>
  );
}