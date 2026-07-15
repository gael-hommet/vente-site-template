"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "vse-theme";

/**
 * Inline, render-blocking script that applies the persisted theme BEFORE first
 * paint to avoid a flash. Injected in <head>. Keep it dependency-free.
 */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(t==='light'){r.setAttribute('data-theme','light');}else if(d){r.setAttribute('data-theme','dark');}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

interface ThemeContextValue {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function readStored(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  return isTheme(stored) ? stored : "system";
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(next: Theme) {
  const root = document.documentElement;
  if (next === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", next);
}

// Minimal external store so theme reads flow through useSyncExternalStore
// (no synchronous setState in an effect, hydration-safe).
const themeListeners = new Set<() => void>();

function subscribeTheme(onChange: () => void) {
  themeListeners.add(onChange);
  const mql =
    typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  mql?.addEventListener("change", onChange);
  return () => {
    themeListeners.delete(onChange);
    mql?.removeEventListener("change", onChange);
  };
}

function writeTheme(next: Theme) {
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
  themeListeners.forEach((l) => l());
}

function resolvedSnapshot(): "light" | "dark" {
  const t = readStored();
  return t === "dark" || (t === "system" && systemPrefersDark()) ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = React.useSyncExternalStore(subscribeTheme, readStored, () => "system" as Theme);
  const resolved = React.useSyncExternalStore(
    subscribeTheme,
    resolvedSnapshot,
    () => "light" as const,
  );

  const setTheme = React.useCallback((next: Theme) => writeTheme(next), []);
  const toggle = React.useCallback(() => {
    writeTheme(resolvedSnapshot() === "dark" ? "light" : "dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}

/** Accessible light/dark toggle button. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={className}
      aria-label={resolved === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}
    >
      {resolved === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
