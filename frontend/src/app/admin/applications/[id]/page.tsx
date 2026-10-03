"use client";

import { ArrowLeft, Check, ExternalLink, Paperclip, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { Alert, DefList, DefRow, PageHeader, errorProps, FieldError, Spinner } from "@/components/ui";
import { api, fieldError } from "@/lib/api";
import { formatDate, formatMoney, METHOD_LABELS } from "@/lib/format";
import type { Application } from "@/lib/types";

type Decision = "approve" | "reject" | "request-correction";

export default function ApplicationReview() {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
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
      setReasonError("A reason is required to reject or request a correction.");
      return;
    }
    setBusy(true);
    setError("");
    setReasonError("");
    try {
      setApp(await api.post<Application>(`/clearance/admin/applications/${id}/${decision}/`, { reason }));
      setReason("");
    } catch (e) {
      const fe = fieldError(e, "reason");
      if (fe) setReasonError(fe);
      else setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (!app) return error ? <Alert tone="error">{error}</Alert> : <Spinner />;
  const s = app.student;
  const canDecide = app.status === "submitted";
  const paid = app.payment_status === "paid";

  const hasAside = canDecide || Boolean(app.decision_reason);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors duration-150 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to submissions
        </Link>
        <PageHeader eyebrow="Clearance application" title={app.reference ?? "Draft"} mono badge={<StatusBadge status={app.status} />} />
      </div>
      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid items-start gap-8 lg:grid-cols-3">
        <div className={`space-y-8 ${hasAside ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <section className="card">
            <h2 className="section-title">Student</h2>
            <div className="mt-4">
              <DefList>
                <DefRow label="Name">{s.full_name}</DefRow>
                <DefRow label="Student no."><span className="font-mono">{s.student_number}</span></DefRow>
                <DefRow label="Email">{s.email}</DefRow>
                <DefRow label="Programme">{s.programme}</DefRow>
                <DefRow label="Faculty">{s.faculty}</DefRow>
                <DefRow label="Level">{s.level}</DefRow>
                <DefRow label="Term">{app.term_name}</DefRow>
                <DefRow label="Submitted">{formatDate(app.submitted_at)}</DefRow>
              </DefList>
            </div>
            {app.student_notes && (
              <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-800/50">
                <p className="eyebrow mb-1">Student note</p>
                <p className="text-slate-700 dark:text-slate-300">{app.student_notes}</p>
              </div>
            )}
          </section>

          <section className="card">
            <h2 className="section-title">Payment</h2>
            <div className="mt-4">
              <DefList>
                <DefRow label="Status"><StatusBadge status={app.payment_status} /></DefRow>
                <DefRow label="Fee"><span className="tabular-nums">{formatMoney(app.fee_amount, app.fee_currency)}</span></DefRow>
                {app.payment && (
                  <>
                    <DefRow label="Reference"><span className="font-mono">{app.payment.reference}</span></DefRow>
                    <DefRow label="Method">{METHOD_LABELS[app.payment.method] ?? app.payment.method}</DefRow>
                    <DefRow label="Paid at">{formatDate(app.payment.paid_at)}</DefRow>
                  </>
                )}
              </DefList>
            </div>
          </section>

          <section className="card">
            <h2 className="section-title">Categories &amp; documents</h2>
            <ul className="mt-4 divide-y divide-line text-sm">
              {app.items.map((i) => (
                <li key={i.id} className="space-y-3 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-ink">{i.requirement.name}</span>
                    <StatusBadge status={i.status} />
                  </div>
                  {i.documents.length === 0 ? (
                    <p className="text-xs text-muted">No documents</p>
                  ) : (
                    <ul className="space-y-2">
                      {i.documents.map((d) => (
                        <li key={d.id} className="flex items-center gap-3 rounded-lg bg-slate-50 py-1.5 pl-3 pr-1.5 dark:bg-slate-800/50">
                          <Paperclip className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-300" />
                          <span className="min-w-0 flex-1 truncate" title={d.original_name}>{d.original_name}</span>
                          <button className="btn btn-ghost btn-sm" aria-label={`View ${d.original_name}`} onClick={() => api.openFile(`/clearance/documents/${d.id}/download/`).catch((e) => setError(e.message))}>
                            View <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {hasAside && (
          <aside className="space-y-8 lg:sticky lg:top-24 lg:col-span-1">
            {app.decision_reason && (
              <Alert tone="warn"><strong>Decision note{app.reviewed_by_name ? ` (${app.reviewed_by_name})` : ""}:</strong> {app.decision_reason}</Alert>
            )}
            {canDecide && (
              <section className="card space-y-6">
                <h2 className="section-title">Decision</h2>
                {!paid && <Alert tone="warn">Approval is disabled until the service fee is paid.</Alert>}
                <div>
                  <label htmlFor="reason" className="label">Reason (required for reject / correction)</label>
                  <textarea id="reason" className="input" rows={4} value={reason} {...errorProps("reason", reasonError)} onChange={(e) => { setReason(e.target.value); setReasonError(""); }} />
                  <FieldError id="reason" message={reasonError} />
                </div>
                <div className="flex flex-col gap-3">
                  <button className="btn btn-primary" disabled={busy || !paid} onClick={() => decide("approve")}><Check className="h-4 w-4" /> Approve</button>
                  <button className="btn btn-warn" disabled={busy} onClick={() => decide("request-correction")}><RotateCcw className="h-4 w-4" /> Request correction</button>
                  <button className="btn btn-danger" disabled={busy} onClick={() => decide("reject")}><X className="h-4 w-4" /> Reject</button>
                </div>
              </section>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
