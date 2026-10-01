"use client";

import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock, Search, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { Alert, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Application, Paginated } from "@/lib/types";

interface Faculty {
  id: number;
  name: string;
}

const STAT_CARDS = [
  { key: "submitted", label: "Awaiting review", icon: Clock, tone: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
  { key: "correction_requested", label: "Correction requested", icon: AlertTriangle, tone: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
  { key: "approved", label: "Approved", icon: CheckCircle2, tone: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
  { key: "rejected", label: "Rejected", icon: XCircle, tone: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
] as const;

export default function AdminDashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [filters, setFilters] = useState({ search: "", status: "", payment_status: "", faculty: "" });
  const [stats, setStats] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Faculty[]>("/academics/faculties/").then(setFaculties).catch(() => {});
    api.get<{ by_status: Record<string, number> }>("/clearance/admin/stats/").then((d) => setStats(d.by_status)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page) });
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const t = setTimeout(() => {
      api
        .get<Paginated<Application>>(`/clearance/admin/applications/?${params}`)
        .then((d) => {
          setApps(d.results);
          setCount(d.count);
          setError("");
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [filters, page]);

  const set = (k: keyof typeof filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPage(1);
    setFilters({ ...filters, [k]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Clearance submissions" subtitle="Review, approve or return student clearance applications." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="card flex items-center gap-4 p-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold leading-none">{stats[key] ?? 0}</p>
              <p className="mt-1 text-xs font-medium text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input aria-label="Search" className="input pl-9" placeholder="Name, number, reference…" value={filters.search} onChange={set("search")} />
        </div>
        <select aria-label="Status" className="input" value={filters.status} onChange={set("status")}>
          <option value="">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="correction_requested">Correction requested</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select aria-label="Payment" className="input" value={filters.payment_status} onChange={set("payment_status")}>
          <option value="">Any payment</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="failed">Failed</option>
        </select>
        <select aria-label="Faculty" className="input" value={filters.faculty} onChange={set("faculty")}>
          <option value="">All faculties</option>
          {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-slate-50/80 dark:bg-slate-800/80 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-5 py-3 font-semibold">Faculty</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Payment</th>
                <th className="px-5 py-3 font-semibold">Submitted</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {apps.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
                  <td className="px-5 py-4 font-mono text-xs">{a.reference}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{a.student.full_name}</p>
                    <p className="text-xs text-muted">{a.student.student_number}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{a.student.faculty}</td>
                  <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-4"><StatusBadge status={a.payment_status} /></td>
                  <td className="px-5 py-4 text-muted">{formatDate(a.submitted_at)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/applications/${a.id}`} className="inline-flex items-center gap-1 font-medium text-brand-700 dark:text-brand-200 hover:underline">
                      Review <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && apps.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-14 text-center text-muted">No submissions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
          <span className="text-muted">{count} result(s)</span>
          <div className="flex gap-2">
            <button className="btn btn-secondary px-3 py-1.5" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button className="btn btn-secondary px-3 py-1.5" disabled={page * 20 >= count} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
