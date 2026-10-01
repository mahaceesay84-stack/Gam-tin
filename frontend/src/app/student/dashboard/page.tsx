"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProgressTracker from "@/components/ProgressTracker";
import StatusBadge from "@/components/StatusBadge";
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
  if (loading) return <p className="text-gray-500">Loading…</p>;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user.full_name}</h1>
        <p className="text-sm text-gray-600">
          {user.student?.student_number} · {user.student?.programme_name} · {user.student?.faculty_name}
        </p>
      </div>
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <ProgressTracker user={user} app={app} />

      {app?.handoff && (
        <section className="rounded-lg border-2 border-green-600 bg-green-50 p-5">
          <h2 className="text-lg font-semibold text-green-900">🎉 Clearance approved — next step</h2>
          <p className="mt-2 text-sm text-green-900">{app.handoff.instructions}</p>
          <a href={app.handoff.portal_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4">
            Go to the official UTG portal
          </a>
        </section>
      )}

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Clearance status</h2>
        {app ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-gray-500">Reference</dt><dd className="font-mono">{app.reference ?? "Not yet submitted"}</dd></div>
            <div><dt className="text-gray-500">Status</dt><dd><StatusBadge status={app.status} /></dd></div>
            <div><dt className="text-gray-500">Term</dt><dd>{app.term_name}</dd></div>
            <div><dt className="text-gray-500">Payment</dt><dd><StatusBadge status={app.payment_status} /></dd></div>
            {app.decision_reason && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Staff message</dt>
                <dd className="rounded bg-amber-50 p-2 text-amber-900">{app.decision_reason}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-gray-600">You have not started a clearance yet.</p>
        )}
        {cta && (
          <div className="mt-4 flex items-center gap-3">
            <Link href={cta.href} className="btn btn-primary">{cta.label}</Link>
            <span className="text-sm text-gray-600">{cta.text}</span>
          </div>
        )}
      </section>

      {payments.length > 0 && (
        <section className="card">
          <h2 className="mb-3 text-lg font-semibold">Payments</h2>
          <ul className="divide-y text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-mono">{p.reference}</span>
                <span>{formatMoney(p.amount, p.currency)} · {METHOD_LABELS[p.method] ?? p.method}</span>
                <StatusBadge status={p.status} />
                <span className="text-gray-500">{formatDate(p.paid_at ?? p.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
