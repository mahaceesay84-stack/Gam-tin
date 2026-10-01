import { FlaskConical } from "lucide-react";

export default function PrototypeBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-100">
      <FlaskConical className="h-3.5 w-3.5 text-amber-300" />
      Prototype — Not an official UTG service.
    </div>
  );
}
