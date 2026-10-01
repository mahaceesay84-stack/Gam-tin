"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AppNotification, Paginated } from "@/lib/types";

export default function NotificationList() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await api.get<Paginated<AppNotification>>("/notifications/");
    setItems(data.results);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Paginated<AppNotification>>("/notifications/")
      .then((d) => !cancelled && setItems(d.results))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function markAll() {
    await api.post("/notifications/read-all/");
    await load();
  }

  async function markOne(id: number) {
    await api.post(`/notifications/${id}/read/`);
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <button className="btn btn-secondary" onClick={markAll}>Mark all as read</button>
      </div>
      {loading && <p className="text-gray-500">Loading…</p>}
      {!loading && items.length === 0 && <p className="card text-gray-500">No notifications yet.</p>}
      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id} className={`card ${n.is_read ? "" : "border-l-4 border-l-brand"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-gray-700">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">{formatDate(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <button className="text-xs text-brand underline" onClick={() => markOne(n.id)}>Mark read</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
