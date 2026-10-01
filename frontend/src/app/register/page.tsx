"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthShell from "@/components/AuthShell";
import { Alert, errorProps, Field } from "@/components/ui";
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
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Full name" htmlFor="full_name" error={errors.full_name}>
          <input id="full_name" {...errorProps("full_name", errors.full_name)} className="input" value={form.full_name} onChange={set("full_name")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={errors.email}>
            <input id="email" {...errorProps("email", errors.email)} type="email" className="input" value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Phone" htmlFor="phone" error={errors.phone}>
            <input id="phone" {...errorProps("phone", errors.phone)} className="input" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="Student number" htmlFor="student_number" error={errors.student_number}>
            <input id="student_number" {...errorProps("student_number", errors.student_number)} className="input" value={form.student_number} onChange={set("student_number")} />
          </Field>
          <Field label="Level (year)" htmlFor="level" error={errors.level}>
            <select id="level" {...errorProps("level", errors.level)} className="input" value={form.level} onChange={set("level")}>
              {[1, 2, 3, 4, 5, 6].map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Programme" htmlFor="programme" error={errors.programme}>
          <select id="programme" {...errorProps("programme", errors.programme)} className="input" value={form.programme} onChange={set("programme")}>
            <option value="">Select programme…</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.faculty_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
          <input id="password" {...errorProps("password", errors.password)} type="password" className="input" value={form.password} onChange={set("password")} />
        </Field>
        <button className="btn btn-primary w-full py-3" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-sm text-muted">
          Already registered? <Link href="/login" className="font-medium text-brand-700 dark:text-brand-200 hover:underline">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
