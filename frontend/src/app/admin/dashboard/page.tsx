"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Application, Paginated } from "@/lib/types";

interface Faculty {
  id: number;
  name: string;
}

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
      <h1 className="text-2xl font-semibold">Clearance submissions</h1>
      <div className="grid gap-3 sm:grid-cols-4">
        {(["submitted", "correction_requested", "approved", "rejected"] as const).map((s) => (
          <div key={s} className="card text-center">
            <p className="text-2xl font-bold">{stats[s] ?? 0}</p>
            <StatusBadge status={s} />
          </div>
        ))}
      </div>

      <div className="card grid gap-3 sm:grid-cols-4">
        <input aria-label="Search" className="input" placeholder="Search name, number, reference…" value={filters.search} onChange={set("search")} />
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

      {error && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-3">Reference</th><th className="p-3">Student</th><th className="p-3">Faculty</th>
              <th className="p-3">Status</th><th className="p-3">Payment</th><th className="p-3">Submitted</th><th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {apps.map((a) => (
              <tr key={a.id}>
                <td className="p-3 font-mono">{a.reference}</td>
                <td className="p-3">{a.student.full_name}<br /><span className="text-xs text-gray-500">{a.student.student_number}</span></td>
                <td className="p-3">{a.student.faculty}</td>
                <td className="p-3"><StatusBadge status={a.status} /></td>
                <td className="p-3"><StatusBadge status={a.payment_status} /></td>
                <td className="p-3 text-gray-500">{formatDate(a.submitted_at)}</td>
                <td className="p-3"><Link href={`/admin/applications/${a.id}`} className="text-brand underline">Review</Link></td>
              </tr>
            ))}
            {!loading && apps.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-gray-500">No submissions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{count} result(s)</span>
        <div className="flex gap-2">
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <button className="btn btn-secondary" disabled={page * 20 >= count} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
