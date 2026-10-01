"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    <div className="mx-auto max-w-lg">
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="text-2xl font-semibold">Create student account</h1>
        {error && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <div>
          <label htmlFor="full_name" className="label">Full name</label>
          <input id="full_name" required className="input" value={form.full_name} onChange={set("full_name")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" required className="input" value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone</label>
            <input id="phone" className="input" value={form.phone} onChange={set("phone")} />
          </div>
          <div>
            <label htmlFor="student_number" className="label">Student number</label>
            <input id="student_number" required className="input" value={form.student_number} onChange={set("student_number")} />
          </div>
          <div>
            <label htmlFor="level" className="label">Level (year)</label>
            <select id="level" className="input" value={form.level} onChange={set("level")}>
              {[1, 2, 3, 4, 5, 6].map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="programme" className="label">Programme</label>
          <select id="programme" required className="input" value={form.programme} onChange={set("programme")}>
            <option value="">Select programme…</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.faculty_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="password" className="label">Password (min 8 characters)</label>
          <input id="password" type="password" required minLength={8} className="input" value={form.password} onChange={set("password")} />
        </div>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Register"}</button>
        <p className="text-center text-sm text-gray-600">
          Already registered? <Link href="/login" className="text-brand underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
