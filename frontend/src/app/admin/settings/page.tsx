"use client";

import { useEffect, useState } from "react";
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
    return <p className="card">Only Super Admins can change system settings.</p>;
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
      <h1 className="text-2xl font-semibold">System settings</h1>
      {message && <p className="rounded bg-green-50 p-2 text-sm text-green-800">{message}</p>}
      <div className="card space-y-4">
        {settings.map((s) => (
          <div key={s.key}>
            <label htmlFor={s.key} className="label">{s.key} <span className="font-normal text-gray-500">— {s.description}</span></label>
            <div className="flex gap-2">
              <input id={s.key} className="input" value={s.value} onChange={(e) => setSettings(settings.map((x) => (x.key === s.key ? { ...x, value: e.target.value } : x)))} />
              <button className="btn btn-primary" onClick={() => save(s)}>Save</button>
            </div>
          </div>
        ))}
      </div>
      <section className="card">
        <h2 className="mb-3 font-semibold">Recent audit log</h2>
        <ul className="divide-y text-sm">
          {logs.slice(0, 30).map((l) => (
            <li key={l.id} className="flex flex-wrap justify-between gap-2 py-1.5">
              <span className="font-mono">{l.action}</span>
              <span className="text-gray-600">{l.actor_email ?? "system"} · {l.entity_type} {l.entity_id}</span>
              <span className="text-gray-400">{formatDate(l.created_at)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
