"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "high-contrast";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_CYCLE: Theme[] = ["dark", "light", "high-contrast"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const prefersHighContrast = window.matchMedia("(prefers-contrast: more)").matches;
    const initial =
      stored ??
      (prefersHighContrast ? "high-contrast" : prefersDark ? "dark" : "light");
    applyTheme(initial);
    setThemeState(initial);
  }, []);

  function applyTheme(next: Theme) {
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    
    // Track theme change for analytics (#398)
    if (typeof window !== "undefined" && navigator.sendBeacon) {
      const payload = JSON.stringify({
        category: "Accessibility",
        action: "theme_change",
        label: next,
        timestamp: new Date().toISOString(),
      });
      navigator.sendBeacon("/api/monitoring/vitals", new Blob([payload], { type: "application/json" }));
    }
  }

  const toggleTheme = () => {
    const idx = THEME_CYCLE.indexOf(theme);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    setThemeState(next);
    applyTheme(next);
  };

  const setTheme = (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
