"use client";

import { CheckCircle2, Loader2, Lock, Smartphone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { Alert, DefRow, errorProps, Field, Spinner } from "@/components/ui";
import { api, fieldError } from "@/lib/api";
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
  const [phoneError, setPhoneError] = useState("");
  const [receipt, setReceipt] = useState<Payment | null>(null);

  if (loading) return <Spinner />;
  if (!app || !app.reference) {
    return (
      <div className="card mx-auto max-w-lg space-y-4 text-center">
        <p>Submit your clearance first before paying the service fee.</p>
        <Link href="/student/clearance" className="btn btn-primary">Go to clearance</Link>
      </div>
    );
  }

  const paid = app.payment?.status === "paid" ? app.payment : null;

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!app) return;
    setError("");
    const digits = phone.replace(/[\s-]/g, "");
    if (!digits) {
      setPhoneError("Mobile number is required.");
      return;
    }
    if (!/^(\+?220)?\d{7}$/.test(digits)) {
      setPhoneError("Enter a valid 7-digit Gambian mobile number.");
      return;
    }
    setPhoneError("");
    setBusy(true);
    try {
      const p = await api.post<Payment>(`/payments/applications/${app.id}/pay/`, { method, phone });
      setReceipt(p);
      await reload();
    } catch (err) {
      const fe = fieldError(err, "phone");
      if (fe) setPhoneError(fe);
      else setError(err instanceof Error ? err.message : "Payment failed");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  if (paid || receipt?.status === "paid") {
    const p = paid ?? receipt!;
    return (
      <div className="animate-in card mx-auto max-w-lg space-y-5 p-8">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-slate-400" />
          <h1 className="mt-4 text-2xl font-bold">Payment successful</h1>
        </div>
        <dl className="divide-y divide-line rounded-lg border border-line px-4">
          <DefRow label="Payment reference"><span className="font-mono">{p.reference}</span></DefRow>
          <DefRow label="Clearance reference"><span className="font-mono">{app.reference}</span></DefRow>
          <DefRow label="Amount">{formatMoney(p.amount, p.currency)}</DefRow>
          <DefRow label="Date">{formatDate(p.paid_at)}</DefRow>
        </dl>
        <p className="text-center text-sm text-muted">Your clearance is now awaiting staff approval. This was a simulated payment.</p>
        <Link href="/student/dashboard" className="btn btn-primary w-full">Back to dashboard</Link>
      </div>
    );
  }

  if (app.status !== "submitted") {
    return (
      <div className="card mx-auto max-w-lg space-y-4 text-center">
        <p>Payment is not available while your application is <StatusBadge status={app.status} />.</p>
        <Link href="/student/dashboard" className="btn btn-secondary">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <form onSubmit={pay} noValidate className="animate-in card mx-auto max-w-lg space-y-6 p-7">
      <div>
        <h1 className="text-2xl font-bold">Digital service fee</h1>
        <p className="mt-1 text-sm text-muted">Pay to send {app.reference} for staff review.</p>
      </div>
      <div className="rounded-xl bg-gradient-to-br from-brand-700 to-brand-600 p-6 text-center text-white shadow-md">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-100">Amount due</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">{formatMoney(app.fee_amount, app.fee_currency)}</p>
      </div>
      <Alert tone="warn">
        Prototype: no real money moves. A number ending in <strong>0000</strong> simulates a failed payment.
      </Alert>
      {error && <Alert tone="error">{error}</Alert>}
      <fieldset>
        <legend className="label">Pay with</legend>
        <div className="grid grid-cols-2 gap-3">
          {METHODS.map((m) => (
            <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3.5 text-sm font-medium transition ${method === m ? "border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200" : "border-line hover:border-slate-300 dark:hover:border-slate-600"}`}>
              <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="sr-only" />
              <Smartphone className="h-4 w-4" />
              {METHOD_LABELS[m]}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Mobile number" htmlFor="phone" error={phoneError} hint="7-digit Gambian number, e.g. 7001001">
        <input id="phone" inputMode="numeric" className="input" placeholder="7001001" value={phone} {...errorProps("phone", phoneError)} onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }} />
      </Field>
      <button className="btn btn-primary w-full py-3" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {busy ? "Processing…" : `Pay ${formatMoney(app.fee_amount, app.fee_currency)}`}
      </button>
    </form>
  );
}
