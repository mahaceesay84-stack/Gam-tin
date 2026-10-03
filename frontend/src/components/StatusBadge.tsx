import { STATUS_LABELS } from "@/lib/format";

const NEUTRAL = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-700";
const GOOD = "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-900";
const BAD = "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-900";
const WARN = "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-amber-200 dark:ring-amber-900";
const INFO = "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 ring-sky-200 dark:ring-sky-900";

const COLORS: Record<string, string> = {
  draft: NEUTRAL,
  unpaid: NEUTRAL,
  pending: NEUTRAL,
  refunded: NEUTRAL,
  submitted: INFO,
  correction_requested: WARN,
  approved: GOOD,
  paid: GOOD,
  cleared: GOOD,
  rejected: BAD,
  failed: BAD,
};

const DOTS: Record<string, string> = {
  submitted: "bg-sky-500",
  correction_requested: "bg-amber-500",
  approved: "bg-amber-500",
  paid: "bg-amber-500",
  cleared: "bg-amber-500",
  rejected: "bg-rose-500",
  failed: "bg-rose-500",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium ring-1 ring-inset ${COLORS[status] ?? NEUTRAL}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status] ?? "bg-slate-400"}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
