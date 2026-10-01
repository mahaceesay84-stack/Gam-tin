"use client";

import { BellRing, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AppNotification, Paginated } from "@/lib/types";

/** Polls notifications and pops a toast for each newly arrived event. */
export default function Toasts() {
  const { user } = useAuth();
  const seen = useRef<Set<number> | null>(null);
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) {
      seen.current = null;
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await api.get<Paginated<AppNotification>>("/notifications/");
        if (cancelled) return;
        const ids = new Set(data.results.map((n) => n.id));
        if (seen.current) {
          const fresh = data.results.filter((n) => !seen.current!.has(n.id) && !n.is_read);
          if (fresh.length) {
            setToasts((t) => [...t, ...fresh]);
            fresh.forEach((n) => setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n.id)), 7000));
          }
        }
        seen.current = ids;
      } catch {
        /* ignore */
      }
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user]);

  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((n) => (
        <div
          key={n.id}
          className="flex gap-3 rounded-xl border border-line bg-surface p-4 shadow-pop"
          style={{ animation: "slide-in 0.3s ease-out both" }}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600">
            <BellRing className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{n.title}</p>
            <p className="mt-0.5 text-sm text-muted">{n.message}</p>
          </div>
          <button
            aria-label="Dismiss"
            className="h-6 w-6 shrink-0 rounded text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
            onClick={() => setToasts((t) => t.filter((x) => x.id !== n.id))}
          >
            <X className="mx-auto h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
