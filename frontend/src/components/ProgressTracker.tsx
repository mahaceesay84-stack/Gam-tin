import type { Application, User } from "@/lib/types";

const STEPS = [
  "Student Verification",
  "Clearance",
  "Payment",
  "Approval",
  "Proceed to Official Portal",
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
    <ol className="grid gap-3 sm:grid-cols-5">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const failed = active && rejected;
        const style = failed
          ? "border-red-500 bg-red-50 text-red-800"
          : done
            ? "border-brand bg-brand text-white"
            : active
              ? "border-brand bg-green-50 text-brand"
              : "border-gray-200 bg-white text-gray-400";
        return (
          <li key={label} className={`rounded-lg border-2 p-3 text-center text-sm ${style}`}>
            <div className="mb-1 text-lg font-bold">{done ? "✓" : failed ? "✕" : i + 1}</div>
            <div className="font-medium leading-tight">{label}</div>
          </li>
        );
      })}
    </ol>
  );
}
