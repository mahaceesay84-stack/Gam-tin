"use client";

import { Bell, BellOff, CheckCheck, CreditCard, FileText, Gavel, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";
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
    <div className="mx-auto max-w-3xl space-y-8">
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
        <div className="card">
          <EmptyState icon={BellOff}>No notifications yet.</EmptyState>
        </div>
      )}
      {items.length > 0 && (
        <ul className="card divide-y divide-line overflow-hidden p-0">
          {items.map((n) => (
            <li key={n.id} className={`relative flex items-start gap-4 px-6 py-4 ${n.is_read ? "" : "bg-slate-50 dark:bg-slate-800/40"}`}>
              {!n.is_read && <span aria-label="Unread" className="absolute left-2.5 top-5.5 h-2 w-2 rounded-full bg-ink" />}
              <span className={`mt-0.5 shrink-0 ${n.is_read ? "text-slate-600 dark:text-slate-300" : "text-ink"}`}>
                {KIND_ICON[n.kind] ?? <Bell className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm text-ink ${n.is_read ? "font-medium" : "font-semibold"}`}>{n.title}</p>
                <p className="mt-0.5 text-sm text-muted">{n.message}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                <time className="text-xs text-muted">{formatDate(n.created_at)}</time>
                {!n.is_read && (
                  <button
                    className="text-xs font-medium text-slate-600 transition-colors duration-150 hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-200"
                    onClick={async () => {
                      await api.post(`/notifications/${n.id}/read/`);
                      await reload();
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
