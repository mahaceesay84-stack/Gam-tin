import { STATUS_LABELS } from "@/lib/format";

const COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  submitted: "bg-sky-50 text-sky-700 ring-sky-200",
  correction_requested: "bg-amber-50 text-amber-800 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  unpaid: "bg-slate-100 text-slate-700 ring-slate-200",
  pending: "bg-slate-100 text-slate-700 ring-slate-200",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
  refunded: "bg-violet-50 text-violet-700 ring-violet-200",
  cleared: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const DOTS: Record<string, string> = {
  submitted: "bg-sky-500",
  correction_requested: "bg-amber-500",
  approved: "bg-emerald-500",
  rejected: "bg-rose-500",
  paid: "bg-emerald-500",
  failed: "bg-rose-500",
  cleared: "bg-emerald-500",
  refunded: "bg-violet-500",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${COLORS[status] ?? COLORS.draft}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status] ?? "bg-slate-400"}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
