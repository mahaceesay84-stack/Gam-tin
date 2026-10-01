"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthShell from "@/components/AuthShell";
import { Alert, Field } from "@/components/ui";
import { api } from "@/lib/api";
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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<Programme[]>("/academics/programmes/").then(setProgrammes).catch(() => setError("Could not load programmes."));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register({ ...form, programme: Number(form.programme), level: Number(form.level) });
      router.push("/student/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create your student account" subtitle="Takes under a minute. Your record is verified instantly." wide>
      <form onSubmit={submit} className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Full name" htmlFor="full_name">
          <input id="full_name" required className="input" value={form.full_name} onChange={set("full_name")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email">
            <input id="email" type="email" required className="input" value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <input id="phone" className="input" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="Student number" htmlFor="student_number">
            <input id="student_number" required className="input" value={form.student_number} onChange={set("student_number")} />
          </Field>
          <Field label="Level (year)" htmlFor="level">
            <select id="level" className="input" value={form.level} onChange={set("level")}>
              {[1, 2, 3, 4, 5, 6].map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Programme" htmlFor="programme">
          <select id="programme" required className="input" value={form.programme} onChange={set("programme")}>
            <option value="">Select programme…</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.faculty_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <input id="password" type="password" required minLength={8} className="input" value={form.password} onChange={set("password")} />
        </Field>
        <button className="btn btn-primary w-full py-3" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-sm text-muted">
          Already registered? <Link href="/login" className="font-medium text-brand-700 hover:underline">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
