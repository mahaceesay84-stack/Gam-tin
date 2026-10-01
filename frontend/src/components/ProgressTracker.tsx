import { BadgeCheck, Check, CreditCard, ExternalLink, FileText, UserCheck, X } from "lucide-react";
import type { Application, User } from "@/lib/types";

const STEPS = [
  { label: "Student Verification", icon: UserCheck },
  { label: "Clearance", icon: FileText },
  { label: "Payment", icon: CreditCard },
  { label: "Approval", icon: BadgeCheck },
  { label: "Proceed to Official Portal", icon: ExternalLink },
];

/** Returns the index of the current step (0-4); 5 means everything is done. */
export function currentStep(user: User, app: Application | null): number {
  if (user.student?.verification_status !== "verified") return 0;
  if (!app || app.status === "draft" || app.status === "correction_requested") return 1;
  if (app.status === "rejected") return 3;
  if (app.payment_status !== "paid") return 2;
  if (app.status === "submitted") return 3;
  return 4;
}

export default function ProgressTracker({ user, app }: { user: User; app: Application | null }) {
  const current = currentStep(user, app);
  const rejected = app?.status === "rejected";
  return (
    <ol className="card grid gap-5 p-6 sm:grid-cols-5 sm:gap-0">
      {STEPS.map(({ label, icon: Icon }, i) => {
        const done = i < current;
        const active = i === current;
        const failed = active && rejected;
        const circle = failed
          ? "border-slate-900 dark:border-slate-200 bg-surface text-ink"
          : done
            ? "border-slate-700 dark:border-slate-300 bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900"
            : active
              ? "border-slate-900 dark:border-slate-200 bg-surface text-ink"
              : "border-line bg-slate-50 dark:bg-slate-800 text-slate-400";
        return (
          <li key={label} className="relative flex items-center gap-3 sm:flex-col sm:gap-2 sm:text-center">
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute right-1/2 top-5 hidden h-0.5 w-full sm:block ${i <= current ? "bg-slate-700 dark:bg-slate-300" : "bg-line"}`}
              />
            )}
            <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition ${circle}`}>
              {done ? <Check className="h-5 w-5" /> : failed ? <X className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </span>
            <span className={`px-1 text-xs font-medium leading-tight ${active || done ? "text-ink" : "text-muted"}`}>
              {label}
              {active && <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-ink">{failed ? "Rejected" : "Current"}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
