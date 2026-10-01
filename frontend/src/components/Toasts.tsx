"use client";

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
            fresh.forEach((n) =>
              setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n.id)), 7000),
            );
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
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((n) => (
        <div key={n.id} className="rounded-lg border border-green-200 bg-white p-3 shadow-lg">
          <div className="flex justify-between gap-2">
            <p className="text-sm font-semibold text-brand">{n.title}</p>
            <button
              aria-label="Dismiss"
              className="text-gray-400 hover:text-gray-700"
              onClick={() => setToasts((t) => t.filter((x) => x.id !== n.id))}
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600">{n.message}</p>
        </div>
      ))}
    </div>
  );
}
