"use client";

import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileCheck2, Loader2, Paperclip, Send, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { Alert, DefList, DefRow, errorProps, FieldError, PageHeader, Spinner } from "@/components/ui";
import { api, fieldError } from "@/lib/api";
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
  const [notesError, setNotesError] = useState("");
  const [submitted, setSubmitted] = useState<Application | null>(null);
  if (!user?.student) return <Spinner />;
  const student = user.student;

  const current = app?.is_editable ? app : null;
  if (submitted) {
    return (
      <div className="animate-in card mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand-600 dark:text-brand-200" />
          <h1 className="page-title mt-4">Clearance submitted</h1>
          <p className="mt-2 text-sm text-muted">Next, pay the digital service fee so staff can review it.</p>
        </div>
        <DefList>
          <DefRow label="Reference number"><span className="font-mono">{submitted.reference}</span></DefRow>
          <DefRow label="Service fee"><span className="tabular-nums">{formatMoney(submitted.fee_amount, submitted.fee_currency)}</span></DefRow>
        </DefList>
        <Link href="/student/payment" className="btn btn-primary w-full">Continue to payment <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  }

  if (app && !app.is_editable && app.status !== "rejected") {
    return (
      <div className="card mx-auto max-w-lg space-y-6">
        <div>
          <p className="eyebrow mb-2">Clearance</p>
          <h1 className="page-title font-mono">{app.reference}</h1>
        </div>
        <DefList>
          <DefRow label="Status"><StatusBadge status={app.status} /></DefRow>
        </DefList>
        <p className="text-sm text-muted">Your application has been submitted and can no longer be edited.</p>
        <Link href="/student/dashboard" className="btn btn-primary w-full">Back to dashboard</Link>
      </div>
    );
  }
  if (app?.status === "rejected") {
    return (
      <div className="card mx-auto max-w-lg space-y-6">
        <div>
          <p className="eyebrow mb-2">Clearance</p>
          <h1 className="page-title">Application rejected</h1>
          <p className="mt-2 font-mono text-sm text-muted">{app.reference}</p>
        </div>
        {app.decision_reason && <Alert tone="error">{app.decision_reason}</Alert>}
        <button className="btn btn-primary w-full" onClick={restart}>Start a new application</button>
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
    setNotesError("");
    try {
      const saved = current
        ? await api.patch<Application>(`/clearance/applications/${current.id}/`, { requirements: selected, student_notes: notes })
        : await api.post<Application>("/clearance/applications/", { requirements: selected, student_notes: notes });
      setApp(saved);
      return saved;
    } catch (e) {
      const fe = fieldError(e, "student_notes");
      if (fe) {
        setNotesError(fe);
        setStep(0);
      } else setError(e instanceof Error ? e.message : "Could not save");
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
    <ol className="flex items-center">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <span className="flex items-center gap-3" aria-current={active ? "step" : undefined}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold tabular-nums transition-colors duration-150 ${done ? "border-slate-700 bg-slate-700 text-white dark:border-slate-300 dark:bg-slate-300 dark:text-slate-900" : active ? "border-slate-900 bg-surface text-ink dark:border-slate-200" : "border-line bg-surface text-muted"}`}>
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`hidden whitespace-nowrap text-sm md:inline ${active ? "font-semibold text-ink" : done ? "font-medium text-ink" : "text-muted"}`}>{label}</span>
            </span>
            {i < STEPS.length - 1 && <span aria-hidden className={`mx-3 h-0.5 flex-1 ${done ? "bg-slate-700 dark:bg-slate-300" : "bg-line"}`} />}
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader eyebrow={`Step ${step + 1} of ${STEPS.length}`} title="Clearance application" subtitle={STEPS[step]} />
      {app?.status === "correction_requested" && (
        <Alert tone="warn"><strong>Correction requested:</strong> {app.decision_reason}</Alert>
      )}
      {stepper}
      {error && <Alert tone="error">{error}</Alert>}

      <div className="card space-y-6">
        {step === 0 && (
          <>
            <h2 className="section-title">Student information</h2>
            <DefList>
              <DefRow label="Name">{user.full_name}</DefRow>
              <DefRow label="Student number">{student.student_number}</DefRow>
              <DefRow label="Email">{user.email}</DefRow>
              <DefRow label="Phone">{user.phone || "—"}</DefRow>
              <DefRow label="Programme">{student.programme_name}</DefRow>
              <DefRow label="Faculty">{student.faculty_name}</DefRow>
              <DefRow label="Level">{student.level}</DefRow>
              <DefRow label="Verification"><span className="capitalize">{student.verification_status}</span></DefRow>
            </DefList>
            <div>
              <label htmlFor="notes" className="label">Notes for the reviewer (optional)</label>
              <textarea id="notes" className="input" rows={3} value={notes} {...errorProps("notes", notesError)} onChange={(e) => { setNotes(e.target.value); setNotesError(""); }} />
              <FieldError id="notes" message={notesError} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h2 className="section-title">Clearance categories</h2>
              <p className="mt-2 text-sm text-muted">Finance / Tuition clearance is always included. Add any other categories that apply to you.</p>
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
              {requirements.map((r) => {
                const on = selected.includes(r.id);
                return (
                  <li key={r.id}>
                    <label className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-brand-500 ${r.is_mandatory ? "cursor-default" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
                      <input type="checkbox" className="h-4 w-4 shrink-0 accent-brand-500" checked={on} disabled={r.is_mandatory} onChange={() => toggle(r)} />
                      <span className="flex-1 font-medium text-ink">{r.name}</span>
                      <span className="flex items-center gap-3 text-xs text-muted">
                        {r.requires_document && <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />Document</span>}
                        {r.is_mandatory && <span className="font-semibold uppercase tracking-wider">Required</span>}
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
              <h2 className="section-title">Document upload</h2>
              <p className="mt-2 text-sm text-muted">PDF, JPG or PNG, up to 5 MB each.</p>
            </div>
            {selectedReqs.filter((r) => r.requires_document).length === 0 ? (
              <p className="text-sm text-muted">No documents are required for your selection.</p>
            ) : (
              <ul className="divide-y divide-line">
                {selectedReqs.filter((r) => r.requires_document).map((r) => {
                  const docs = docsFor(r.id);
                  return (
                    <li key={r.id} className="space-y-3 py-6 text-sm first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-ink">{r.name}</p>
                          {r.document_hint && <p className="mt-1 text-xs text-muted">{r.document_hint}</p>}
                        </div>
                        {docs.length > 0 ? (
                          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-brand-700 dark:text-brand-200"><FileCheck2 className="h-4 w-4" />Uploaded</span>
                        ) : (
                          <span className="shrink-0 text-xs font-medium text-rose-600 dark:text-rose-400">Required</span>
                        )}
                      </div>
                      {docs.length > 0 && (
                        <ul className="space-y-2">
                          {docs.map((d) => (
                            <li key={d.id} className="flex items-center gap-3 rounded-lg bg-slate-50 py-1.5 pl-3 pr-1.5 dark:bg-slate-800/50">
                              <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                              <span className="min-w-0 flex-1 truncate" title={d.original_name}>{d.original_name}</span>
                              <button type="button" aria-label={`Remove ${d.original_name}`} title="Remove" className="btn btn-ghost btn-icon text-slate-400 hover:text-rose-600 dark:hover:text-rose-400" onClick={() => removeDoc(d.id)}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 text-sm font-medium text-slate-600 transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-500 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800/50">
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
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h2 className="section-title">Review &amp; submit</h2>
              <p className="mt-2 text-sm text-muted">Check the details below before you submit.</p>
            </div>
            <DefList>
              <DefRow label="Name">{user.full_name}</DefRow>
              <DefRow label="Student number">{student.student_number}</DefRow>
              <DefRow label="Programme">{student.programme_name}</DefRow>
              {notes && <DefRow label="Notes">{notes}</DefRow>}
            </DefList>
            <div>
              <p className="eyebrow mb-3">Categories</p>
              <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line text-sm">
                {selectedReqs.map((r) => {
                  const n = docsFor(r.id).length;
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
                      <span className="font-medium text-ink">{r.name}</span>
                      <span className="text-muted">{r.requires_document ? `${n} document${n === 1 ? "" : "s"}` : "No document needed"}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            {missingDocs.length > 0 && (
              <Alert tone="error">Missing documents: {missingDocs.map((r) => r.name).join(", ")}</Alert>
            )}
            <p className="text-xs text-muted">A reference number (CLR-YYYY-XXXXXX) is generated when you submit.</p>
          </>
        )}

        <div className="flex justify-between border-t border-line pt-6">
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
