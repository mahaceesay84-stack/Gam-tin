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
        <div key={n.id} className="animate-in flex items-start gap-4 rounded-card border border-line bg-surface px-4 py-4 shadow-pop">
          <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{n.title}</p>
            <p className="mt-0.5 text-sm text-muted">{n.message}</p>
          </div>
          <button
            aria-label="Dismiss"
            className="btn btn-ghost btn-icon -mr-2 -mt-2 text-slate-400"
            onClick={() => setToasts((t) => t.filter((x) => x.id !== n.id))}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
