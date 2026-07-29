"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}> = ({ children, defaultTheme = "light", storageKey = "sakani-theme" }) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey) as Theme | null;
    if (saved) {
      setThemeState(saved);
    }
  }, [storageKey]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    let systemTheme: "light" | "dark" = "light";
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      systemTheme = "dark";
    }

    const activeTheme = theme === "system" ? systemTheme : theme;
    root.classList.add(activeTheme);
    setResolvedTheme(activeTheme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
