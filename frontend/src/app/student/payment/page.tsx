"use client";

import { CheckCircle2, Loader2, Lock, Smartphone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { Alert, DefList, DefRow, errorProps, Field, Spinner } from "@/components/ui";
import { api, fieldError } from "@/lib/api";
import { formatDate, formatMoney, METHOD_LABELS } from "@/lib/format";
import type { Payment } from "@/lib/types";
import { useMyApplication } from "@/lib/useMyApplication";

const METHODS = ["wave", "mobile_money", "qmoney", "afrimoney"];
const CARRIER_TINT: Record<string, string> = {
  wave: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  mobile_money: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  qmoney: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  afrimoney: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
};

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
      <div className="card mx-auto max-w-lg space-y-6 text-center">
        <p className="text-sm text-muted">Submit your clearance first before paying the service fee.</p>
        <Link href="/student/clearance" className="btn btn-primary w-full">Go to clearance</Link>
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
      <div className="animate-in card mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand-600 dark:text-brand-200" />
          <h1 className="page-title mt-4">Payment successful</h1>
          <p className="mt-2 text-sm text-muted">Your clearance is now awaiting staff approval. This was a simulated payment.</p>
        </div>
        <DefList>
          <DefRow label="Payment reference"><span className="font-mono">{p.reference}</span></DefRow>
          <DefRow label="Clearance reference"><span className="font-mono">{app.reference}</span></DefRow>
          <DefRow label="Amount"><span className="tabular-nums">{formatMoney(p.amount, p.currency)}</span></DefRow>
          <DefRow label="Date">{formatDate(p.paid_at)}</DefRow>
        </DefList>
        <Link href="/student/dashboard" className="btn btn-primary w-full">Back to dashboard</Link>
      </div>
    );
  }

  if (app.status !== "submitted") {
    return (
      <div className="card mx-auto max-w-lg space-y-6 text-center">
        <p className="text-sm text-muted">Payment is not available while your application is <StatusBadge status={app.status} />.</p>
        <Link href="/student/dashboard" className="btn btn-secondary w-full">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <form onSubmit={pay} noValidate className="animate-in card mx-auto max-w-lg space-y-6">
      <div>
        <p className="eyebrow mb-2">Payment</p>
        <h1 className="page-title">Digital service fee</h1>
        <p className="mt-2 text-sm text-muted">Pay to send <span className="font-mono">{app.reference}</span> for staff review.</p>
      </div>
      <div className="rounded-xl bg-brand-700 p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-100">Amount due</p>
        <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight">{formatMoney(app.fee_amount, app.fee_currency)}</p>
      </div>
      <Alert tone="warn">
        Prototype: no real money moves. A number ending in <strong>0000</strong> simulates a failed payment.
      </Alert>
      {error && <Alert tone="error">{error}</Alert>}
      <fieldset>
        <legend className="label">Pay with</legend>
        <div className="grid grid-cols-2 gap-3">
          {METHODS.map((m) => (
            <label key={m} className={`flex h-16 cursor-pointer items-center gap-3 rounded-xl border px-3 text-sm font-medium transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-500 ${method === m ? "border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-600 dark:bg-brand-900/30 dark:text-brand-200" : "border-line text-slate-700 hover:border-slate-300 dark:text-slate-200 dark:hover:border-slate-600"}`}>
              <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="sr-only" />
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${CARRIER_TINT[m]}`}><Smartphone className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1 truncate">{METHOD_LABELS[m]}</span>
              {method === m && <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-200" />}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Mobile number" htmlFor="phone" error={phoneError} hint="7-digit Gambian number, e.g. 7001001">
        <input id="phone" inputMode="numeric" className="input" placeholder="7001001" value={phone} {...errorProps("phone", phoneError)} onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }} />
      </Field>
      <button className="btn btn-primary w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {busy ? "Processing…" : `Pay ${formatMoney(app.fee_amount, app.fee_currency)}`}
      </button>
    </form>
  );
}
