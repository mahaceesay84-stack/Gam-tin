import { Check } from "lucide-react";

const ROWS = ["Finance & Tuition", "Library", "Registrar"];

export default function StatusMockup() {
  return (
    <div
      role="img"
      aria-label="Example clearance status screen: Finance, Library and Registrar cleared, GMD 50 fee paid via Wave, cleared for course registration"
      className="mx-auto w-full max-w-[300px] rounded-[2.5rem] border border-slate-300 bg-slate-900 p-2.5 shadow-pop dark:border-slate-600"
    >
      <div aria-hidden className="overflow-hidden rounded-[2rem] bg-white text-slate-900">
        <div className="mx-auto mt-2 h-1.5 w-16 rounded-full bg-slate-200" />
        <div className="space-y-4 px-5 pb-6 pt-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-600">Clearance status</p>
            <p className="mt-1 text-lg font-bold text-[#0B1F4B]">Awa Jallow</p>
            <span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-sm font-medium text-slate-700">
              ID 2024-0137
            </span>
          </div>
          <ul className="space-y-2.5">
            {ROWS.map((r) => (
              <li key={r} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
                <span className="font-medium text-slate-800">{r}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                  <Check className="h-4 w-4" /> Cleared
                </span>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-2 rounded-lg bg-[#0B1F4B] px-3 py-2.5 text-sm font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-[#E8A920]" />
            GMD 50 Paid via Wave <Check className="ml-auto h-4 w-4" />
          </p>
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center text-sm font-semibold text-emerald-900">
            Cleared for Course Registration
          </p>
        </div>
      </div>
    </div>
  );
}
