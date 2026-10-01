"use client";

import { Save, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, EmptyState, errorProps, FieldError, PageHeader } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";

interface Setting {
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

interface Log {
  id: number;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.role !== "super_admin") return;
    api.get<Setting[]>("/admin/settings/").then(setSettings).catch((e) => setMessage(e.message));
    api.get<Log[]>("/admin/audit-logs/").then(setLogs).catch(() => {});
  }, [user]);

  if (user?.role !== "super_admin") {
    return <Alert tone="warn">Only Super Admins can change system settings.</Alert>;
  }

  async function save(s: Setting) {
    setMessage("");
    if (!s.value.trim()) {
      setErrors((p) => ({ ...p, [s.key]: "A value is required." }));
      return;
    }
    setErrors((p) => ({ ...p, [s.key]: "" }));
    try {
      await api.put(`/admin/settings/${s.key}/`, { value: s.value });
      setMessage(`Saved ${s.key}.`);
    } catch (e) {
      const fe = e instanceof ApiError ? (e.fieldErrors?.value?.[0] ?? e.fieldErrors?.[s.key]?.[0]) : undefined;
      if (fe) setErrors((p) => ({ ...p, [s.key]: fe }));
      else setMessage(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="System settings" subtitle="Runtime configuration, including the digital service fee." />
      {message && <Alert tone="success">{message}</Alert>}
      <div className="card space-y-6">
        {settings.map((s) => (
          <form key={s.key} noValidate onSubmit={(e) => { e.preventDefault(); save(s); }}>
            <label htmlFor={s.key} className="label">
              <span className="font-mono">{s.key}</span>
              <span className="ml-2 font-normal text-muted">{s.description}</span>
            </label>
            <div className="flex gap-3">
              <input id={s.key} className="input" value={s.value} {...errorProps(s.key, errors[s.key])} onChange={(e) => { setSettings(settings.map((x) => (x.key === s.key ? { ...x, value: e.target.value } : x))); setErrors((p) => ({ ...p, [s.key]: "" })); }} />
              <button type="submit" className="btn btn-primary"><Save className="h-4 w-4" /> Save</button>
            </div>
            <FieldError id={s.key} message={errors[s.key]} />
          </form>
        ))}
      </div>
      <section className="card">
        <h2 className="section-title">Recent audit log</h2>
        {logs.length === 0 ? (
          <EmptyState icon={ScrollText}>No audit events yet.</EmptyState>
        ) : (
          <ul className="mt-4 divide-y divide-line text-sm">
            {logs.slice(0, 30).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0">
                <span className="font-mono text-xs text-ink">{l.action}</span>
                <span className="min-w-0 flex-1 text-slate-600 dark:text-slate-300">{l.actor_email ?? "system"} · {l.entity_type} {l.entity_id}</span>
                <time className="text-xs text-muted">{formatDate(l.created_at)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
