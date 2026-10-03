import { FlaskConical } from "lucide-react";

export default function PrototypeBanner() {
  return (
    <div className="flex items-center justify-center gap-2 border-b border-line bg-slate-900 px-4 py-2 text-xs font-medium text-slate-200 dark:bg-slate-950">
      <FlaskConical className="h-3.5 w-3.5 text-slate-300" />
      Prototype — Not an official UTG service.
    </div>
  );
}
