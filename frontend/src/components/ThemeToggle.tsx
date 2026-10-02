"use client";

import "material-symbols/outlined.css";
import { useEffect, useState } from "react";

export default function ThemeToggle({ labeled = false }: { labeled?: boolean }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Sync with the class set by the no-flash script in layout.tsx.
    const id = requestAnimationFrame(() => setDark(document.documentElement.classList.contains("dark")));
    return () => cancelAnimationFrame(id);
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("utg-theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  };

  const iconEl =
    dark === null ? <span className="h-5 w-5" /> : <span className="material-symbols-outlined !text-[20px]" aria-hidden="true">{dark ? "light_mode" : "dark_mode"}</span>;

  if (labeled) {
    return (
      <button
        type="button"
        className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        onClick={toggle}
      >
        {iconEl}
        <span>{dark ? "Light mode" : "Dark mode"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      onClick={toggle}
    >
      {iconEl}
    </button>
  );
}
