"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthShell from "@/components/AuthShell";
import { Alert } from "@/components/ui";
import { Input, PasswordInput, Select } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Programme } from "@/lib/types";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    student_number: "",
    programme: "",
    level: "4",
    password: "",
  });
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<Programme[]>("/academics/programmes/").then(setProgrammes).catch(() => setError("Could not load programmes."));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    {
      setForm({ ...form, [k]: e.target.value });
      setErrors((p) => ({ ...p, [k]: "" }));
    };

  function validate() {
    const v: Record<string, string> = {};
    if (!form.full_name.trim()) v.full_name = "Full name is required.";
    if (!form.email.trim()) v.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) v.email = "Enter a valid email address.";
    if (!form.phone.trim()) v.phone = "Mobile number is required.";
    else if (!/^(\+?220)?\d{7}$/.test(form.phone.replace(/[\s-]/g, ""))) v.phone = "Enter a valid 7-digit Gambian mobile number.";
    if (!form.student_number.trim()) v.student_number = "Student number is required.";
    if (!form.level) v.level = "Select your level.";
    if (!form.programme) v.programme = "Select your programme.";
    if (!form.password) v.password = "Password is required.";
    else if (form.password.length < 8) v.password = "Password must be at least 8 characters.";
    return v;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await register({ ...form, programme: Number(form.programme), level: Number(form.level) });
      router.push("/student/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        const fe: Record<string, string> = {};
        for (const [k, m] of Object.entries(err.fieldErrors)) fe[k] = m[0];
        setErrors(fe);
      }
      if (!(err instanceof ApiError && err.fieldErrors)) setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create your student account" subtitle="Takes under a minute. Your record is verified instantly." wide>
      <form onSubmit={submit} noValidate className="space-y-6">
        {error && <Alert tone="error">{error}</Alert>}
        <Input label="Full name" autoComplete="name" error={errors.full_name} value={form.full_name} onChange={set("full_name")} />
        <div className="grid gap-6 sm:grid-cols-2">
          <Input label="Email" type="email" autoComplete="email" error={errors.email} value={form.email} onChange={set("email")} />
          <Input label="Phone" type="tel" autoComplete="tel" error={errors.phone} value={form.phone} onChange={set("phone")} />
          <Input label="Student number" error={errors.student_number} value={form.student_number} onChange={set("student_number")} />
          <Select label="Level (year)" error={errors.level} value={form.level} onChange={set("level")}>
            {[1, 2, 3, 4, 5, 6].map((l) => <option key={l} value={l}>{l}</option>)}
          </Select>
        </div>
        <Select label="Programme" placeholder="Select programme…" error={errors.programme} value={form.programme} onChange={set("programme")}>
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>{p.name} — {p.faculty_name}</option>
          ))}
        </Select>
        <PasswordInput label="Password" autoComplete="new-password" hint="At least 8 characters." error={errors.password} value={form.password} onChange={set("password")} />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-amber-400 px-4 py-3 font-semibold text-slate-900 shadow-sm transition
                     hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                     disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>
        <p className="pt-1 text-center text-sm text-muted">
          Already registered? <Link href="/login" className="link">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
