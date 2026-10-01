"use client";

import { Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { Alert, errorProps, Field } from "@/components/ui";
import { fieldError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginForm({ portal }: { portal: "student" | "admin" }) {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function validate() {
    const v: Record<string, string> = {};
    if (!email.trim()) v.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) v.email = "Enter a valid email address.";
    if (!password) v.password = "Password is required.";
    return v;
  }

  const clear = (k: string) => setErrors((p) => ({ ...p, [k]: "" }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await login(email, password, portal);
      router.push(portal === "admin" ? "/admin/dashboard" : "/student/dashboard");
    } catch (err) {
      const fe = { email: fieldError(err, "email"), password: fieldError(err, "password") };
      if (fe.email || fe.password) setErrors({ email: fe.email ?? "", password: fe.password ?? "" });
      else setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  const staff = portal === "admin";
  return (
    <AuthShell
      title={staff ? "Staff sign in" : "Welcome back"}
      subtitle={staff ? "Admins and Super Admins only." : "Sign in to continue your clearance."}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Email" htmlFor="email" error={errors.email}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="email" type="email" className="input pl-10" placeholder="you@example.com" value={email} {...errorProps("email", errors.email)} onChange={(e) => { setEmail(e.target.value); clear("email"); }} />
          </div>
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="password" type="password" className="input pl-10" placeholder="••••••••" value={password} {...errorProps("password", errors.password)} onChange={(e) => { setPassword(e.target.value); clear("password"); }} />
          </div>
        </Field>
        <button className="btn btn-primary w-full py-3" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-muted">
          {staff ? (
            <Link href="/login" className="font-medium text-brand-700 dark:text-brand-200 hover:underline">Student login</Link>
          ) : (
            <>
              New here? <Link href="/register" className="font-medium text-brand-700 dark:text-brand-200 hover:underline">Create an account</Link>
              {" · "}
              <Link href="/admin/login" className="font-medium text-brand-700 dark:text-brand-200 hover:underline">Staff login</Link>
            </>
          )}
        </p>
      </form>
    </AuthShell>
  );
}
