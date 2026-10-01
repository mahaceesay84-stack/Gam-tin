import { AlertCircle, CheckCircle2, Info, Loader2, TriangleAlert } from "lucide-react";

type Tone = "error" | "success" | "warn" | "info";

const TONES: Record<Tone, { box: string; icon: React.ReactNode }> = {
  error: { box: "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300", icon: <AlertCircle className="h-4 w-4 shrink-0" /> },
  success: { box: "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300", icon: <CheckCircle2 className="h-4 w-4 shrink-0" /> },
  warn: { box: "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300", icon: <TriangleAlert className="h-4 w-4 shrink-0" /> },
  info: { box: "border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300", icon: <Info className="h-4 w-4 shrink-0" /> },
};

export function Alert({ tone = "info", children }: { tone?: Tone; children: React.ReactNode }) {
  const t = TONES[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${t.box}`}>
      <span className="mt-0.5">{t.icon}</span>
      <div>{children}</div>
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Inline error shown directly beneath an input. Pair with `errorProps`. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} role="alert" aria-live="polite" className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
      {message}
    </p>
  );
}

/** Spread onto an input to wire aria-invalid / aria-describedby to its FieldError. */
export function errorProps(id: string, message?: string) {
  return message ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      <FieldError id={htmlFor} message={error} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function DefRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{children}</dd>
    </div>
  );
}
