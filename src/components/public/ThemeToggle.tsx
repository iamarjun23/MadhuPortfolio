"use client";

import { useEffect, useState } from "react";

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

export function ThemeToggle({ initialTheme }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeName>(initialTheme);

  useEffect(() => {
    persistTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle--${theme}`}
      data-theme-mode={theme}
      aria-label={`Switch to ${getNextTheme(theme)} theme`}
      aria-pressed={theme === "light"}
      title={`Switch to ${getNextTheme(theme)} theme`}
      onClick={() => setTheme(getNextTheme)}
    >
      <span className="theme-toggle__switch" aria-hidden="true">
        <span className="theme-toggle__thumb" />
      </span>
    </button>
  );
}
