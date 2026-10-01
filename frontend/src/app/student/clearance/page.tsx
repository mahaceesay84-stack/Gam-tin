"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
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

  if (loadError) return <p className="rounded bg-red-50 p-2 text-sm text-red-700">{loadError}</p>;
  if (loading || !requirements) return <p className="text-gray-500">Loading…</p>;
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
  if (!user?.student) return <p className="text-gray-500">Loading…</p>;
  const student = user.student;

  const current = app?.is_editable ? app : null;
  if (submitted) {
    return (
      <div className="card mx-auto max-w-lg space-y-3 text-center">
        <h1 className="text-2xl font-semibold text-green-800">Clearance submitted</h1>
        <p>Your reference number</p>
        <p className="font-mono text-3xl font-bold text-brand">{submitted.reference}</p>
        <p className="text-sm text-gray-600">
          Next, pay the digital service fee of {formatMoney(submitted.fee_amount, submitted.fee_currency)} so staff can review it.
        </p>
        <Link href="/student/payment" className="btn btn-primary">Continue to payment</Link>
      </div>
    );
  }

  if (app && !app.is_editable && app.status !== "rejected") {
    return (
      <div className="card space-y-3">
        <h1 className="text-2xl font-semibold">Clearance {app.reference}</h1>
        <p>Status: <StatusBadge status={app.status} /></p>
        <p className="text-sm text-gray-600">Your application has been submitted and can no longer be edited.</p>
        <Link href="/student/dashboard" className="btn btn-primary">Back to dashboard</Link>
      </div>
    );
  }
  if (app?.status === "rejected") {
    return (
      <div className="card space-y-3">
        <h1 className="text-2xl font-semibold">Application {app.reference} was rejected</h1>
        {app.decision_reason && <p className="rounded bg-red-50 p-2 text-sm text-red-800">{app.decision_reason}</p>}
        <button className="btn btn-primary" onClick={restart}>
          Start a new application
        </button>
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Clearance application</h1>
      {app?.status === "correction_requested" && (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Correction requested:</strong> {app.decision_reason}
        </p>
      )}
      <ol className="flex flex-wrap gap-2 text-sm">
        {STEPS.map((s, i) => (
          <li key={s} className={`rounded-full px-3 py-1 ${i === step ? "bg-brand text-white" : i < step ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      {error && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="card space-y-4">
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold">Student information</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-gray-500">Name</dt><dd>{user.full_name}</dd></div>
              <div><dt className="text-gray-500">Student number</dt><dd>{student.student_number}</dd></div>
              <div><dt className="text-gray-500">Email</dt><dd>{user.email}</dd></div>
              <div><dt className="text-gray-500">Phone</dt><dd>{user.phone || "—"}</dd></div>
              <div><dt className="text-gray-500">Programme</dt><dd>{student.programme_name}</dd></div>
              <div><dt className="text-gray-500">Faculty</dt><dd>{student.faculty_name}</dd></div>
              <div><dt className="text-gray-500">Level</dt><dd>{student.level}</dd></div>
              <div><dt className="text-gray-500">Verification</dt><dd><StatusBadge status={student.verification_status === "verified" ? "paid" : "pending"} /> {student.verification_status}</dd></div>
            </dl>
            <div>
              <label htmlFor="notes" className="label">Notes for the reviewer (optional)</label>
              <textarea id="notes" className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold">Clearance categories</h2>
            <p className="text-sm text-gray-600">Mandatory categories are always included.</p>
            <ul className="space-y-2">
              {requirements.map((r) => (
                <li key={r.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3 text-sm">
                    <input type="checkbox" className="mt-1" checked={selected.includes(r.id)} disabled={r.is_mandatory} onChange={() => toggle(r)} />
                    <span>
                      <span className="font-medium">{r.name}</span>{" "}
                      {r.is_mandatory && <span className="text-xs text-gray-500">(required)</span>}
                      {r.requires_document && <span className="ml-1 text-xs text-amber-700">document needed</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold">Document upload</h2>
            <p className="text-sm text-gray-600">PDF, JPG or PNG, up to 5 MB each.</p>
            {selectedReqs.filter((r) => r.requires_document || docsFor(r.id).length > 0).length === 0 && (
              <p className="text-sm text-gray-500">No documents are required for your selection.</p>
            )}
            {selectedReqs.filter((r) => r.requires_document).map((r) => (
              <div key={r.id} className="rounded-md border border-gray-200 p-3 text-sm">
                <p className="font-medium">{r.name} <span className="text-xs text-red-600">required</span></p>
                {r.document_hint && <p className="text-xs text-gray-500">{r.document_hint}</p>}
                <ul className="my-2 space-y-1">
                  {docsFor(r.id).map((d) => (
                    <li key={d.id} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1">
                      <span>{d.original_name}</span>
                      <button type="button" className="text-xs text-red-600 underline" onClick={() => removeDoc(d.id)}>Remove</button>
                    </li>
                  ))}
                </ul>
                <input
                  type="file"
                  aria-label={`Upload ${r.name}`}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(r.id, f);
                    e.target.value = "";
                  }}
                />
              </div>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold">Review &amp; submit</h2>
            <p className="text-sm">{user.full_name} · {student.student_number} · {student.programme_name}</p>
            <ul className="space-y-1 text-sm">
              {selectedReqs.map((r) => (
                <li key={r.id} className="flex justify-between rounded bg-gray-50 px-3 py-2">
                  <span>{r.name}</span>
                  <span className="text-gray-500">{docsFor(r.id).length} document(s)</span>
                </li>
              ))}
            </ul>
            {notes && <p className="text-sm text-gray-600">Notes: {notes}</p>}
            {missingDocs.length > 0 && (
              <p className="rounded bg-red-50 p-2 text-sm text-red-700">
                Missing documents: {missingDocs.map((r) => r.name).join(", ")}
              </p>
            )}
            <p className="text-xs text-gray-500">A reference number (CLR-YYYY-XXXXXX) is generated when you submit.</p>
          </>
        )}

        <div className="flex justify-between pt-2">
          <button className="btn btn-secondary" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>Back</button>
          {step < 3 ? (
            <button className="btn btn-primary" disabled={busy || (step === 1 && selected.length === 0)} onClick={next}>
              {busy ? "Saving…" : "Next"}
            </button>
          ) : (
            <button className="btn btn-primary" disabled={busy || missingDocs.length > 0} onClick={submit}>
              {busy ? "Submitting…" : "Submit clearance"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
