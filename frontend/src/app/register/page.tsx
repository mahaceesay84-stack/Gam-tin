import BrandMark from "@/components/BrandMark";
import RegisterForm from "./register-form";

// TODO: fetch from /api/programmes/
const PROGRAMMES = [
  { id: 1, name: "BSc Computer Science" },
  { id: 2, name: "BSc Information Technology" },
  { id: 3, name: "BSc Accounting" },
  { id: 4, name: "BSc Business Administration" },
  { id: 5, name: "BEd Primary Education" },
  { id: 6, name: "Bachelor of Laws (LLB)" },
  { id: 7, name: "BSc Agriculture" },
  { id: 8, name: "BSc Nursing" },
];

export default function RegisterPage() {
  return (
    <div className="animate-in mx-auto max-w-xl pt-28">
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandMark className="h-16 w-16" />
        <h1 className="page-title mt-6">Create your student account</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">We&apos;ll verify your student record.</p>
      </div>
      <div className="card">
        <RegisterForm programmes={PROGRAMMES} />
      </div>
    </div>
  );
}
