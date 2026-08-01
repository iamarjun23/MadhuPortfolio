"use client";

import { useEffect, useState } from "react";

export type ThemeName = "dark" | "light";

type ThemeToggleProps = Readonly<{
  initialTheme: ThemeName;
}>;

const themeLabels: Record<ThemeName, string> = {
  dark: "Suite",
  light: "Sheet",
};

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
      className="theme-toggle"
      aria-label={`Switch to ${getNextTheme(theme)} theme`}
      onClick={() => setTheme(getNextTheme)}
    >
      <span className="theme-toggle__dot" aria-hidden="true" />
      <span className="theme-toggle__label">{themeLabels[theme]}</span>
    </button>
  );
}
