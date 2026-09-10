"use client";

import { useState } from "react";

export type ThemeName = "dark" | "light";

type ThemeToggleProps = Readonly<{
  initialTheme: ThemeName;
}>;

function getNextTheme(theme: ThemeName): ThemeName {
  return theme === "dark" ? "light" : "dark";
}

function persistTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  document.cookie = `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

// `initialTheme` is only the site-wide default now — the public pages are prerendered, so the
// server cannot know this visitor's choice. The root layout's inline script has already applied the
// saved cookie to <html> before this hydrates, so read the answer back from there rather than
// writing over it. The prerendered markup carries the default, so the button is allowed to hydrate
// to a different one.
function readAppliedTheme(fallback: ThemeName): ThemeName {
  if (typeof document === "undefined") return fallback;
  const applied = document.documentElement.dataset.theme;
  return applied === "light" || applied === "dark" ? applied : fallback;
}

export function ThemeToggle({ initialTheme }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeName>(() => readAppliedTheme(initialTheme));

  return (
    <button
      type="button"
      suppressHydrationWarning
      className={`theme-toggle theme-toggle--${theme}`}
      data-theme-mode={theme}
      aria-label={`Switch to ${getNextTheme(theme)} theme`}
      aria-pressed={theme === "light"}
      title={`Switch to ${getNextTheme(theme)} theme`}
      onClick={() => {
        const next = getNextTheme(theme);
        setTheme(next);
        persistTheme(next);
      }}
    >
      <span className="theme-toggle__switch" aria-hidden="true">
        <span className="theme-toggle__thumb" />
      </span>
    </button>
  );
}
