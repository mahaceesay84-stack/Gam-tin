"use client";

import { Save, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
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

  useEffect(() => {
    if (user?.role !== "super_admin") return;
    api.get<Setting[]>("/admin/settings/").then(setSettings).catch((e) => setMessage(e.message));
    api.get<Log[]>("/admin/audit-logs/").then(setLogs).catch(() => {});
  }, [user]);

  if (user?.role !== "super_admin") {
    return <Alert tone="warn">Only Super Admins can change system settings.</Alert>;
  }

  async function save(s: Setting) {
    try {
      await api.put(`/admin/settings/${s.key}/`, { value: s.value });
      setMessage(`Saved ${s.key}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="System settings" subtitle="Runtime configuration, including the digital service fee." />
      {message && <Alert tone="success">{message}</Alert>}
      <div className="card space-y-5">
        {settings.map((s) => (
          <div key={s.key}>
            <label htmlFor={s.key} className="label">
              <span className="font-mono">{s.key}</span>
              <span className="ml-2 font-normal text-muted">{s.description}</span>
            </label>
            <div className="flex gap-2">
              <input id={s.key} className="input" value={s.value} onChange={(e) => setSettings(settings.map((x) => (x.key === s.key ? { ...x, value: e.target.value } : x)))} />
              <button className="btn btn-primary" onClick={() => save(s)}><Save className="h-4 w-4" /> Save</button>
            </div>
          </div>
        ))}
      </div>
      <section className="card">
        <h2 className="flex items-center gap-2 font-semibold"><ScrollText className="h-4 w-4 text-slate-400" /> Recent audit log</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {logs.slice(0, 30).map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">{l.action}</span>
              <span className="text-slate-600">{l.actor_email ?? "system"} · {l.entity_type} {l.entity_id}</span>
              <span className="text-xs text-muted">{formatDate(l.created_at)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
