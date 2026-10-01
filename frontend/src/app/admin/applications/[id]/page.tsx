"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatDate, formatMoney, METHOD_LABELS } from "@/lib/format";
import type { Application } from "@/lib/types";

type Decision = "approve" | "reject" | "request-correction";

export default function ApplicationReview() {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Application>(`/clearance/admin/applications/${id}/`)
      .then((a) => !cancelled && setApp(a))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load"));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function decide(decision: Decision) {
    if (decision !== "approve" && !reason.trim()) {
      setError("Please give a reason.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      setApp(await api.post<Application>(`/clearance/admin/applications/${id}/${decision}/`, { reason }));
      setReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (!app) return <p className="text-gray-500">{error || "Loading…"}</p>;
  const s = app.student;
  const canDecide = app.status === "submitted";
  const paid = app.payment_status === "paid";

  return (
    <div className="space-y-6">
      <Link href="/admin/dashboard" className="text-sm text-brand underline">← Back to submissions</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-semibold">{app.reference}</h1>
        <StatusBadge status={app.status} />
      </div>
      {error && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-semibold">Student</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd>{s.full_name}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Student no.</dt><dd>{s.student_number}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd>{s.email}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Programme</dt><dd>{s.programme}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Faculty</dt><dd>{s.faculty}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Level</dt><dd>{s.level}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Term</dt><dd>{app.term_name}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Submitted</dt><dd>{formatDate(app.submitted_at)}</dd></div>
          </dl>
          {app.student_notes && <p className="mt-3 rounded bg-gray-50 p-2 text-sm">Student note: {app.student_notes}</p>}
        </section>

        <section className="card">
          <h2 className="mb-3 font-semibold">Payment</h2>
          <p className="mb-2"><StatusBadge status={app.payment_status} /></p>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Fee</dt><dd>{formatMoney(app.fee_amount, app.fee_currency)}</dd></div>
            {app.payment && (
              <>
                <div className="flex justify-between"><dt className="text-gray-500">Reference</dt><dd className="font-mono">{app.payment.reference}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Method</dt><dd>{METHOD_LABELS[app.payment.method] ?? app.payment.method}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Paid at</dt><dd>{formatDate(app.payment.paid_at)}</dd></div>
              </>
            )}
          </dl>
        </section>
      </div>

      <section className="card">
        <h2 className="mb-3 font-semibold">Clearance categories &amp; documents</h2>
        <ul className="divide-y text-sm">
          {app.items.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{i.requirement.name}</span>
              <span className="flex flex-wrap items-center gap-3">
                {i.documents.length === 0 && <span className="text-xs text-gray-400">no documents</span>}
                {i.documents.map((d) => (
                  <button key={d.id} className="text-brand underline" onClick={() => api.openFile(`/clearance/documents/${d.id}/download/`).catch((e) => setError(e.message))}>
                    {d.original_name}
                  </button>
                ))}
                <StatusBadge status={i.status} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      {app.decision_reason && (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Decision note{app.reviewed_by_name ? ` (${app.reviewed_by_name})` : ""}:</strong> {app.decision_reason}
        </p>
      )}

      {canDecide && (
        <section className="card space-y-3">
          <h2 className="font-semibold">Decision</h2>
          {!paid && <p className="rounded bg-amber-50 p-2 text-sm text-amber-900">Approval is disabled until the service fee is paid.</p>}
          <label htmlFor="reason" className="label">Reason (required for reject / correction)</label>
          <textarea id="reason" className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-primary" disabled={busy || !paid} onClick={() => decide("approve")}>Approve</button>
            <button className="btn btn-warn" disabled={busy} onClick={() => decide("request-correction")}>Request correction</button>
            <button className="btn btn-danger" disabled={busy} onClick={() => decide("reject")}>Reject</button>
          </div>
        </section>
      )}
    </div>
  );
}
