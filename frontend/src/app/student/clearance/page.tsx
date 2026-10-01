"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, Loader2, Paperclip, Send, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { Alert, DefRow, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import type { Application, Requirement } from "@/lib/types";
import { useMyApplication } from "@/lib/useMyApplication";

const STEPS = ["Student Info", "Clearance Categories", "Document Upload", "Review & Submit"];

export default function ClearancePage() {
  const { app, setApp, loading } = useMyApplication();
  const [requirements, setRequirements] = useState<Requirement[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [round, setRound] = useState(0);

  useEffect(() => {
    api
      .get<Requirement[]>("/clearance/requirements/")
      .then(setRequirements)
      .catch(() => setLoadError("Could not load categories."));
  }, []);

  if (loadError) return <Alert tone="error">{loadError}</Alert>;
  if (loading || !requirements) return <Spinner />;
  return (
    <Wizard
      key={round}
      app={app}
      setApp={setApp}
      requirements={requirements}
      restart={() => {
        setApp(null);
        setRound(round + 1);
      }}
    />
  );
}

function Wizard({
  app,
  setApp,
  requirements,
  restart,
}: {
  app: Application | null;
  setApp: (a: Application | null) => void;
  requirements: Requirement[];
  restart: () => void;
}) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<number[]>(() =>
    app?.is_editable
      ? app.items.map((i) => i.requirement.id)
      : requirements.filter((r) => r.is_mandatory).map((r) => r.id),
  );
  const [notes, setNotes] = useState(app?.is_editable ? app.student_notes : "");
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<Application | null>(null);
  if (!user?.student) return <Spinner />;
  const student = user.student;

  const current = app?.is_editable ? app : null;
  if (submitted) {
    return (
      <div className="animate-in card mx-auto max-w-lg space-y-4 p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="text-2xl font-bold">Clearance submitted</h1>
        <p className="text-sm text-muted">Your reference number</p>
        <p className="rounded-xl bg-brand-50 dark:bg-brand-900/30 py-4 font-mono text-3xl font-bold tracking-wide text-brand-700 dark:text-brand-200">{submitted.reference}</p>
        <p className="text-sm text-muted">
          Next, pay the digital service fee of {formatMoney(submitted.fee_amount, submitted.fee_currency)} so staff can review it.
        </p>
        <Link href="/student/payment" className="btn btn-primary w-full">Continue to payment <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  }

  if (app && !app.is_editable && app.status !== "rejected") {
    return (
      <div className="card mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">Clearance <span className="font-mono">{app.reference}</span></h1>
        <p className="flex items-center gap-2 text-sm">Status: <StatusBadge status={app.status} /></p>
        <p className="text-sm text-muted">Your application has been submitted and can no longer be edited.</p>
        <Link href="/student/dashboard" className="btn btn-primary">Back to dashboard</Link>
      </div>
    );
  }
  if (app?.status === "rejected") {
    return (
      <div className="card mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">Application {app.reference} was rejected</h1>
        {app.decision_reason && <Alert tone="error">{app.decision_reason}</Alert>}
        <button className="btn btn-primary" onClick={restart}>Start a new application</button>
      </div>
    );
  }

  const selectedReqs = requirements.filter((r) => selected.includes(r.id));

  function toggle(r: Requirement) {
    if (r.is_mandatory) return;
    setSelected((s) => (s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id]));
  }

  async function saveCategories(): Promise<Application | null> {
    setBusy(true);
    setError("");
    try {
      const saved = current
        ? await api.patch<Application>(`/clearance/applications/${current.id}/`, { requirements: selected, student_notes: notes })
        : await api.post<Application>("/clearance/applications/", { requirements: selected, student_notes: notes });
      setApp(saved);
      return saved;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function upload(requirementId: number, file: File) {
    if (!current) return;
    setError("");
    const form = new FormData();
    form.append("requirement", String(requirementId));
    form.append("file", file);
    try {
      await api.post(`/clearance/applications/${current.id}/documents/`, form);
      setApp(await api.get<Application>(`/clearance/applications/${current.id}/`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  async function removeDoc(docId: number) {
    if (!current) return;
    await api.delete(`/clearance/applications/${current.id}/documents/${docId}/`);
    setApp(await api.get<Application>(`/clearance/applications/${current.id}/`));
  }

  async function submit() {
    if (!current) return;
    setBusy(true);
    setError("");
    try {
      setSubmitted(await api.post<Application>(`/clearance/applications/${current.id}/submit/`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  const docsFor = (rid: number) => current?.items.find((i) => i.requirement.id === rid)?.documents ?? [];
  const missingDocs = selectedReqs.filter((r) => r.requires_document && docsFor(r.id).length === 0);

  async function next() {
    if (step === 1) {
      if (!(await saveCategories())) return;
    }
    setStep(step + 1);
  }

  const stepper = (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${i < step ? "bg-brand-600 text-white" : i === step ? "bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-900" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
            {i < step ? "✓" : i + 1}
          </span>
          <span className={`hidden sm:inline ${i === step ? "font-semibold text-ink" : "text-muted"}`}>{s}</span>
          {i < STEPS.length - 1 && <span className="mx-1 hidden h-px w-6 bg-line sm:block" />}
        </li>
      ))}
    </ol>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">Clearance application</h1>
        <p className="mt-1 text-sm text-muted">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
      </div>
      {app?.status === "correction_requested" && (
        <Alert tone="warn"><strong>Correction requested:</strong> {app.decision_reason}</Alert>
      )}
      {stepper}
      {error && <Alert tone="error">{error}</Alert>}

      <div className="card space-y-5 p-7">
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold">Student information</h2>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <DefRow label="Name">{user.full_name}</DefRow>
              <DefRow label="Student number">{student.student_number}</DefRow>
              <DefRow label="Email">{user.email}</DefRow>
              <DefRow label="Phone">{user.phone || "—"}</DefRow>
              <DefRow label="Programme">{student.programme_name}</DefRow>
              <DefRow label="Faculty">{student.faculty_name}</DefRow>
              <DefRow label="Level">{student.level}</DefRow>
              <DefRow label="Verification"><span className="capitalize">{student.verification_status}</span></DefRow>
            </dl>
            <div>
              <label htmlFor="notes" className="label">Notes for the reviewer (optional)</label>
              <textarea id="notes" className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h2 className="text-lg font-semibold">Clearance categories</h2>
              <p className="mt-1 text-sm text-muted">Mandatory categories are always included.</p>
            </div>
            <ul className="space-y-2.5">
              {requirements.map((r) => {
                const on = selected.includes(r.id);
                return (
                  <li key={r.id}>
                    <label className={`flex items-start gap-3 rounded-lg border-2 p-3.5 text-sm transition ${on ? "border-brand-500 bg-brand-50/60 dark:bg-brand-900/60" : "border-line"} ${r.is_mandatory ? "cursor-default" : "cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"}`}>
                      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={on} disabled={r.is_mandatory} onChange={() => toggle(r)} />
                      <span className="flex-1">
                        <span className="font-medium">{r.name}</span>
                        <span className="ml-2 inline-flex gap-1.5 align-middle">
                          {r.is_mandatory && <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:text-slate-300">Required</span>}
                          {r.requires_document && <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:text-amber-300"><Paperclip className="h-3 w-3" />Document</span>}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-lg font-semibold">Document upload</h2>
              <p className="mt-1 text-sm text-muted">PDF, JPG or PNG, up to 5 MB each.</p>
            </div>
            {selectedReqs.filter((r) => r.requires_document).length === 0 && (
              <p className="text-sm text-muted">No documents are required for your selection.</p>
            )}
            {selectedReqs.filter((r) => r.requires_document).map((r) => {
              const docs = docsFor(r.id);
              return (
                <div key={r.id} className="rounded-lg border border-line p-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{r.name}</p>
                    {docs.length > 0 ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"><FileCheck2 className="h-3.5 w-3.5" />Uploaded</span> : <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Required</span>}
                  </div>
                  {r.document_hint && <p className="mt-0.5 text-xs text-muted">{r.document_hint}</p>}
                  <ul className="my-3 space-y-1.5">
                    {docs.map((d) => (
                      <li key={d.id} className="flex items-center justify-between rounded-md bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                        <span className="flex items-center gap-2 truncate"><Paperclip className="h-3.5 w-3.5 text-slate-400" />{d.original_name}</span>
                        <button type="button" aria-label={`Remove ${d.original_name}`} className="text-slate-400 transition hover:text-rose-600 dark:hover:text-rose-400" onClick={() => removeDoc(d.id)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line px-4 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/50 hover:text-brand-700 dark:hover:text-brand-200">
                    <Upload className="h-4 w-4" /> Choose a file
                    <input
                      type="file"
                      className="sr-only"
                      aria-label={`Upload ${r.name}`}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) upload(r.id, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              );
            })}
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold">Review &amp; submit</h2>
            <p className="text-sm text-muted">{user.full_name} · {student.student_number} · {student.programme_name}</p>
            <ul className="divide-y divide-line rounded-lg border border-line text-sm">
              {selectedReqs.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-4 py-3">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-muted">{docsFor(r.id).length} document(s)</span>
                </li>
              ))}
            </ul>
            {notes && <p className="text-sm text-muted">Notes: {notes}</p>}
            {missingDocs.length > 0 && (
              <Alert tone="error">Missing documents: {missingDocs.map((r) => r.name).join(", ")}</Alert>
            )}
            <p className="text-xs text-muted">A reference number (CLR-YYYY-XXXXXX) is generated when you submit.</p>
          </>
        )}

        <div className="flex justify-between border-t border-line pt-5">
          <button className="btn btn-secondary" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < 3 ? (
            <button className="btn btn-primary" disabled={busy || (step === 1 && selected.length === 0)} onClick={next}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Saving…" : "Next"} {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          ) : (
            <button className="btn btn-primary" disabled={busy || missingDocs.length > 0} onClick={submit}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {busy ? "Submitting…" : "Submit clearance"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
