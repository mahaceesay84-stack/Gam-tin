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
    <ol className="card grid gap-6 sm:grid-cols-5 sm:gap-0">
      {STEPS.map(({ label, icon: Icon }, i) => {
        const done = i < current;
        const active = i === current;
        const failed = active && rejected;
        const circle = done
          ? "border-slate-700 bg-slate-700 text-white dark:border-slate-300 dark:bg-slate-300 dark:text-slate-900"
          : active
            ? "border-slate-900 bg-surface text-ink dark:border-slate-200"
            : "border-line bg-slate-50 text-slate-600 dark:text-slate-300 dark:bg-slate-800";
        return (
          <li key={label} className="relative flex items-center gap-4 sm:flex-col sm:items-center sm:gap-3 sm:text-center">
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute right-1/2 top-5 hidden h-0.5 w-full sm:block ${i <= current ? "bg-slate-700 dark:bg-slate-300" : "bg-line"}`}
              />
            )}
            <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ${circle}`}>
              {done ? <Check className="h-5 w-5" /> : failed ? <X className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </span>
            <span className={`px-1 text-sm font-medium leading-snug ${active || done ? "text-ink" : "text-muted"}`}>
              {label}
              {active && <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-muted">{failed ? "Rejected" : "Current"}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
