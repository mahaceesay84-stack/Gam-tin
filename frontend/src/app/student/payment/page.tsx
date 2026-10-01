"use client";

import Link from "next/link";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatDate, formatMoney, METHOD_LABELS } from "@/lib/format";
import type { Payment } from "@/lib/types";
import { useMyApplication } from "@/lib/useMyApplication";

const METHODS = ["wave", "mobile_money", "qmoney", "afrimoney"];

export default function PaymentPage() {
  const { app, loading, reload } = useMyApplication();
  const [method, setMethod] = useState("wave");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Payment | null>(null);

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (!app || !app.reference) {
    return (
      <div className="card">
        <p>Submit your clearance first before paying the service fee.</p>
        <Link href="/student/clearance" className="btn btn-primary mt-3">Go to clearance</Link>
      </div>
    );
  }

  const paid = app.payment?.status === "paid" ? app.payment : null;

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!app) return;
    setBusy(true);
    setError("");
    try {
      const p = await api.post<Payment>(`/payments/applications/${app.id}/pay/`, { method, phone });
      setReceipt(p);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  if (paid || receipt?.status === "paid") {
    const p = paid ?? receipt!;
    return (
      <div className="card mx-auto max-w-lg space-y-3">
        <h1 className="text-2xl font-semibold text-green-800">Payment successful</h1>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt>Payment reference</dt><dd className="font-mono">{p.reference}</dd></div>
          <div className="flex justify-between"><dt>Clearance reference</dt><dd className="font-mono">{app.reference}</dd></div>
          <div className="flex justify-between"><dt>Amount</dt><dd>{formatMoney(p.amount, p.currency)}</dd></div>
          <div className="flex justify-between"><dt>Date</dt><dd>{formatDate(p.paid_at)}</dd></div>
        </dl>
        <p className="text-sm text-gray-600">Your clearance is now awaiting staff approval. This was a simulated payment.</p>
        <Link href="/student/dashboard" className="btn btn-primary">Back to dashboard</Link>
      </div>
    );
  }

  if (app.status !== "submitted") {
    return (
      <div className="card">
        <p>Payment is not available while your application is <StatusBadge status={app.status} />.</p>
        <Link href="/student/dashboard" className="btn btn-secondary mt-3">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <form onSubmit={pay} className="card mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Digital service fee</h1>
      <div className="rounded-lg bg-green-50 p-4 text-center">
        <p className="text-sm text-gray-600">Amount due for {app.reference}</p>
        <p className="text-3xl font-bold text-brand">{formatMoney(app.fee_amount, app.fee_currency)}</p>
      </div>
      <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">
        Prototype: no real money moves. A number ending in 0000 simulates a failed payment.
      </p>
      {error && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <fieldset>
        <legend className="label">Pay with</legend>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map((m) => (
            <label key={m} className={`flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm ${method === m ? "border-brand bg-green-50" : "border-gray-300"}`}>
              <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} />
              {METHOD_LABELS[m]}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="phone" className="label">Mobile number</label>
        <input id="phone" required className="input" placeholder="e.g. 7001001" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <button className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Processing…" : `Pay ${formatMoney(app.fee_amount, app.fee_currency)}`}
      </button>
    </form>
  );
}
