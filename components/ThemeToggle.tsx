"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const KEY = "shark-tank:theme";

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};
const notify = () => listeners.forEach((cb) => cb());

const systemTheme = (): Theme => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
const currentTheme = (): Theme => {
  const set = document.documentElement.dataset.theme;
  return set === "light" || set === "dark" ? set : systemTheme();
};

/** Light/dark switch in the top bar. The choice is remembered; without one the system setting applies. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light" as Theme);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark") {
        document.documentElement.dataset.theme = saved;
        notify();
      }
    } catch {
      // Storage blocked: fall back to the system setting.
    }
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Private mode: the switch still works for this page view.
    }
    notify();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === "dark"}
      aria-label="Dark theme"
      title="Switch between light and dark"
      className="inline-flex size-9 items-center justify-center rounded-md text-slate-300 hover:bg-slate-800 hover:text-slate-100"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" />
      </svg>
    </button>
  );
}
