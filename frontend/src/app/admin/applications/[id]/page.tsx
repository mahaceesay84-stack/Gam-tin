"use client";

import { ArrowLeft, Check, FileText, Gavel, Paperclip, RotateCcw, User, Wallet, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { Alert, DefRow, Spinner } from "@/components/ui";
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

  if (!app) return error ? <Alert tone="error">{error}</Alert> : <Spinner />;
  const s = app.student;
  const canDecide = app.status === "submitted";
  const paid = app.payment_status === "paid";

  return (
    <div className="space-y-6">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to submissions
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">{app.reference}</h1>
        <StatusBadge status={app.status} />
      </div>
      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="flex items-center gap-2 font-semibold"><User className="h-4 w-4 text-slate-400" /> Student</h2>
          <dl className="mt-3 divide-y divide-line">
            <DefRow label="Name">{s.full_name}</DefRow>
            <DefRow label="Student no.">{s.student_number}</DefRow>
            <DefRow label="Email">{s.email}</DefRow>
            <DefRow label="Programme">{s.programme}</DefRow>
            <DefRow label="Faculty">{s.faculty}</DefRow>
            <DefRow label="Level">{s.level}</DefRow>
            <DefRow label="Term">{app.term_name}</DefRow>
            <DefRow label="Submitted">{formatDate(app.submitted_at)}</DefRow>
          </dl>
          {app.student_notes && <p className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-600 dark:text-slate-300">Student note: {app.student_notes}</p>}
        </section>

        <section className="card">
          <h2 className="flex items-center gap-2 font-semibold"><Wallet className="h-4 w-4 text-slate-400" /> Payment</h2>
          <dl className="mt-3 divide-y divide-line">
            <DefRow label="Status"><StatusBadge status={app.payment_status} /></DefRow>
            <DefRow label="Fee">{formatMoney(app.fee_amount, app.fee_currency)}</DefRow>
            {app.payment && (
              <>
                <DefRow label="Reference"><span className="font-mono">{app.payment.reference}</span></DefRow>
                <DefRow label="Method">{METHOD_LABELS[app.payment.method] ?? app.payment.method}</DefRow>
                <DefRow label="Paid at">{formatDate(app.payment.paid_at)}</DefRow>
              </>
            )}
          </dl>
        </section>
      </div>

      <section className="card">
        <h2 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-slate-400" /> Clearance categories &amp; documents</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {app.items.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="font-medium">{i.requirement.name}</span>
              <span className="flex flex-wrap items-center gap-3">
                {i.documents.length === 0 && <span className="text-xs text-muted">no documents</span>}
                {i.documents.map((d) => (
                  <button key={d.id} className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:text-brand-200 transition hover:bg-brand-50 dark:hover:bg-brand-900/30" onClick={() => api.openFile(`/clearance/documents/${d.id}/download/`).catch((e) => setError(e.message))}>
                    <Paperclip className="h-3 w-3" /> {d.original_name}
                  </button>
                ))}
                <StatusBadge status={i.status} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      {app.decision_reason && (
        <Alert tone="warn"><strong>Decision note{app.reviewed_by_name ? ` (${app.reviewed_by_name})` : ""}:</strong> {app.decision_reason}</Alert>
      )}

      {canDecide && (
        <section className="card space-y-4">
          <h2 className="flex items-center gap-2 font-semibold"><Gavel className="h-4 w-4 text-slate-400" /> Decision</h2>
          {!paid && <Alert tone="warn">Approval is disabled until the service fee is paid.</Alert>}
          <div>
            <label htmlFor="reason" className="label">Reason (required for reject / correction)</label>
            <textarea id="reason" className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-primary" disabled={busy || !paid} onClick={() => decide("approve")}><Check className="h-4 w-4" /> Approve</button>
            <button className="btn btn-warn" disabled={busy} onClick={() => decide("request-correction")}><RotateCcw className="h-4 w-4" /> Request correction</button>
            <button className="btn btn-danger" disabled={busy} onClick={() => decide("reject")}><X className="h-4 w-4" /> Reject</button>
          </div>
        </section>
      )}
    </div>
  );
}
