import BrandMark from "@/components/BrandMark";
import type { Programme } from "@/lib/types";
import RegisterForm from "./register-form";

async function loadProgrammes(): Promise<Programme[] | null> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  try {
    const res = await fetch(`${base}/api/academics/programmes/`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

export default async function RegisterPage() {
  const programmes = await loadProgrammes();
  return (
    <div className="animate-in mx-auto max-w-xl pt-28">
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandMark className="h-16 w-16" />
        <h1 className="page-title mt-6">Create your student account</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">We&apos;ll verify your student record.</p>
      </div>
      <div className="card">
        <RegisterForm programmes={programmes ?? []} loadFailed={programmes === null} />
      </div>
    </div>
  );
}
