"use client";

import { Bell, BellOff, CheckCheck, CreditCard, FileText, Gavel, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AppNotification, Paginated } from "@/lib/types";

const KIND_ICON: Record<string, React.ReactNode> = {
  clearance: <FileText className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  decision: <Gavel className="h-4 w-4" />,
  verification: <UserCheck className="h-4 w-4" />,
};

export default function NotificationList() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const data = await api.get<Paginated<AppNotification>>("/notifications/");
    setItems(data.results);
  };

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Clearance, payment and decision events."
        action={
          <button
            className="btn btn-secondary"
            onClick={async () => {
              await api.post("/notifications/read-all/");
              await reload();
            }}
          >
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </button>
        }
      />
      {loading && <Spinner />}
      {!loading && items.length === 0 && (
        <div className="card flex flex-col items-center gap-2 py-14 text-center text-muted">
          <BellOff className="h-8 w-8 text-slate-300" />
          No notifications yet.
        </div>
      )}
      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id} className={`card flex items-start gap-4 p-4 transition hover:shadow-pop ${n.is_read ? "" : "border-brand-200 dark:border-brand-900 bg-brand-50/40 dark:bg-brand-900/40"}`}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.is_read ? "bg-slate-100 dark:bg-slate-800 text-slate-500" : "bg-brand-600 text-white"}`}>
              {KIND_ICON[n.kind] ?? <Bell className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{n.title}</p>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
              <p className="mt-1.5 text-xs text-muted">{formatDate(n.created_at)}</p>
            </div>
            {!n.is_read && (
              <button
                className="shrink-0 text-xs font-medium text-brand-700 dark:text-brand-200 hover:underline"
                onClick={async () => {
                  await api.post(`/notifications/${n.id}/read/`);
                  await reload();
                }}
              >
                Mark read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
