"use client";

import { ArrowRight, CheckCircle2, ExternalLink, Receipt } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProgressTracker from "@/components/ProgressTracker";
import StatusBadge from "@/components/StatusBadge";
import { Alert, DefList, DefRow, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatMoney, METHOD_LABELS } from "@/lib/format";
import type { Payment } from "@/lib/types";
import { useMyApplication } from "@/lib/useMyApplication";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { app, loading, error } = useMyApplication();
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    api.get<Payment[]>("/payments/").then(setPayments).catch(() => {});
  }, []);

  if (!user) return null;
  if (loading) return <Spinner />;

  let cta: { href: string; label: string; text: string } | null = null;
  if (!app || app.status === "draft") {
    cta = { href: "/student/clearance", label: app ? "Continue clearance" : "Start clearance", text: "Begin your clearance application." };
  } else if (app.status === "correction_requested") {
    cta = { href: "/student/clearance", label: "Fix and resubmit", text: "Staff asked for a correction." };
  } else if (app.status === "submitted" && app.payment_status !== "paid") {
    cta = { href: "/student/payment", label: "Pay service fee", text: "Pay the digital service fee to send your clearance for approval." };
  } else if (app.status === "rejected") {
    cta = { href: "/student/clearance", label: "Start a new application", text: "Your last application was rejected." };
  }

  const first = user.full_name.split(" ")[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Student"
        title={`Welcome, ${first}`}
        subtitle={`${user.student?.student_number} · ${user.student?.programme_name} · ${user.student?.faculty_name}`}
      />
      {error && <Alert tone="error">{error}</Alert>}

      <ProgressTracker user={user} app={app} />

      {app?.handoff && (
        <section className="flex flex-col gap-4 rounded-card border border-brand-200 bg-brand-50 p-6 shadow-card sm:flex-row sm:items-center dark:border-brand-500/30 dark:bg-brand-500/10">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-brand-600 dark:text-brand-200" />
          <div className="flex-1">
            <h2 className="section-title">Clearance approved — your next step</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{app.handoff.instructions}</p>
          </div>
          <a href={app.handoff.portal_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary shrink-0">
            Go to official portal <ExternalLink className="h-4 w-4" />
          </a>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="card flex flex-col lg:col-span-2">
          <h2 className="section-title">Clearance status</h2>
          {app ? (
            <div className="mt-4 space-y-4">
              <DefList>
                <DefRow label="Reference"><span className="font-mono">{app.reference ?? "Not yet submitted"}</span></DefRow>
                <DefRow label="Status"><StatusBadge status={app.status} /></DefRow>
                <DefRow label="Term">{app.term_name}</DefRow>
                <DefRow label="Payment"><StatusBadge status={app.payment_status} /></DefRow>
              </DefList>
              {app.decision_reason && <Alert tone="warn"><strong>Staff message:</strong> {app.decision_reason}</Alert>}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">You have not started a clearance yet.</p>
          )}
          {cta && (
            <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-line pt-6">
              <Link href={cta.href} className="btn btn-primary">{cta.label} <ArrowRight className="h-4 w-4" /></Link>
              <span className="text-sm text-muted">{cta.text}</span>
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="section-title">Payments</h2>
          {payments.length === 0 ? (
            <div className="mt-2">
              <EmptyState icon={Receipt}>No payments yet.</EmptyState>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-ink">{p.reference}</p>
                    <p className="mt-1 text-xs text-muted">{METHOD_LABELS[p.method] ?? p.method} · {formatDate(p.paid_at ?? p.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="font-semibold tabular-nums text-ink">{formatMoney(p.amount, p.currency)}</span>
                    <StatusBadge status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
