"use client";

import { ArrowRight, CalendarDays, CheckCircle2, ExternalLink, Hash, PartyPopper, Receipt, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProgressTracker from "@/components/ProgressTracker";
import StatusBadge from "@/components/StatusBadge";
import { Alert, PageHeader, Spinner } from "@/components/ui";
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
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${first}`}
        subtitle={`${user.student?.student_number} · ${user.student?.programme_name} · ${user.student?.faculty_name}`}
      />
      {error && <Alert tone="error">{error}</Alert>}

      <ProgressTracker user={user} app={app} />

      {app?.handoff && (
        <section className="relative overflow-hidden rounded-card border border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 dark:from-emerald-950/40 to-brand-50 dark:to-brand-900/30 p-6 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <PartyPopper className="h-8 w-8 shrink-0 text-slate-400" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-brand-900 dark:text-brand-200">Clearance approved — your next step</h2>
              <p className="mt-1 text-sm leading-relaxed text-brand-900/80 dark:text-brand-200">{app.handoff.instructions}</p>
            </div>
            <a href={app.handoff.portal_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary shrink-0">
              Go to official portal <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="text-lg font-semibold">Clearance status</h2>
          {app ? (
            <dl className="mt-4 grid gap-5 text-sm sm:grid-cols-2">
              <div className="flex gap-3">
                <Hash className="mt-0.5 h-4 w-4 text-slate-400" />
                <div><dt className="text-muted">Reference</dt><dd className="mt-0.5 font-mono font-medium">{app.reference ?? "Not yet submitted"}</dd></div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-slate-400" />
                <div><dt className="text-muted">Status</dt><dd className="mt-0.5"><StatusBadge status={app.status} /></dd></div>
              </div>
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />
                <div><dt className="text-muted">Term</dt><dd className="mt-0.5 font-medium">{app.term_name}</dd></div>
              </div>
              <div className="flex gap-3">
                <Wallet className="mt-0.5 h-4 w-4 text-slate-400" />
                <div><dt className="text-muted">Payment</dt><dd className="mt-0.5"><StatusBadge status={app.payment_status} /></dd></div>
              </div>
              {app.decision_reason && (
                <div className="sm:col-span-2">
                  <Alert tone="warn"><strong>Staff message:</strong> {app.decision_reason}</Alert>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted">You have not started a clearance yet.</p>
          )}
          {cta && (
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-5">
              <Link href={cta.href} className="btn btn-primary">{cta.label} <ArrowRight className="h-4 w-4" /></Link>
              <span className="text-sm text-muted">{cta.text}</span>
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Receipt className="h-5 w-5 text-slate-400" /> Payments</h2>
          {payments.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No payments yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line text-sm">
              {payments.map((p) => (
                <li key={p.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs">{p.reference}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>{formatMoney(p.amount, p.currency)} · {METHOD_LABELS[p.method] ?? p.method}</span>
                    <span className="text-xs">{formatDate(p.paid_at ?? p.created_at)}</span>
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
