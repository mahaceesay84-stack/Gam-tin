"use client";

import { ArrowUpRight, Inbox, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { Alert, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Application, Paginated } from "@/lib/types";

interface Faculty {
  id: number;
  name: string;
}

const STAT_CARDS = [
  { key: "submitted", label: "Awaiting review" },
  { key: "correction_requested", label: "Correction requested" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
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
    <div className="space-y-8">
      <PageHeader title="Clearance submissions" subtitle="Review, approve or return student clearance applications." />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, label }) => (
          <div key={key} className="card">
            <p className="eyebrow">{label}</p>
            <p className="mt-3 text-3xl font-bold leading-none tabular-nums text-ink">{stats[key] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative lg:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input aria-label="Search" className="input pl-10" placeholder="Name, number, reference…" value={filters.search} onChange={set("search")} />
          </div>
          <select aria-label="Status" className="input lg:w-48" value={filters.status} onChange={set("status")}>
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="correction_requested">Correction requested</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select aria-label="Payment" className="input lg:w-48" value={filters.payment_status} onChange={set("payment_status")}>
            <option value="">Any payment</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="failed">Failed</option>
          </select>
          <select aria-label="Faculty" className="input lg:w-48" value={filters.faculty} onChange={set("faculty")}>
            <option value="">All faculties</option>
            {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        {error && <Alert tone="error">{error}</Alert>}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-slate-50 dark:bg-slate-800/50">
                <tr className="eyebrow">
                  <th className="h-11 px-6 font-semibold">Reference</th>
                  <th className="h-11 px-6 font-semibold">Student</th>
                  <th className="h-11 px-6 font-semibold">Faculty</th>
                  <th className="h-11 px-6 font-semibold">Status</th>
                  <th className="h-11 px-6 font-semibold">Payment</th>
                  <th className="h-11 px-6 font-semibold">Submitted</th>
                  <th className="h-11 px-6"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {apps.map((a) => (
                  <tr key={a.id} className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-ink">{a.reference}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-ink">{a.student.full_name}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted">{a.student.student_number}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{a.student.faculty}</td>
                    <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                    <td className="px-6 py-4"><StatusBadge status={a.payment_status} /></td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted">{formatDate(a.submitted_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/applications/${a.id}`} className="link inline-flex items-center gap-1 whitespace-nowrap">
                        Review <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {loading && (
                  <tr><td colSpan={7}><Spinner /></td></tr>
                )}
                {!loading && apps.length === 0 && (
                  <tr><td colSpan={7}><EmptyState icon={Inbox}>No submissions match these filters.</EmptyState></td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line px-6 py-3 text-sm">
            <span className="tabular-nums text-muted">{count} {count === 1 ? "result" : "results"}</span>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <button className="btn btn-secondary btn-sm" disabled={page * 20 >= count} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
