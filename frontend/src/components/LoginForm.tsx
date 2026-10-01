"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function LoginForm({ portal }: { portal: "student" | "admin" }) {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password, portal);
      router.push(portal === "admin" ? "/admin/dashboard" : "/student/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="text-2xl font-semibold">{portal === "admin" ? "Admin login" : "Student login"}</h1>
        {error && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="text-center text-sm text-gray-600">
          {portal === "admin" ? (
            <Link href="/login" className="text-brand underline">Student login</Link>
          ) : (
            <>
              No account? <Link href="/register" className="text-brand underline">Register</Link> ·{" "}
              <Link href="/admin/login" className="text-brand underline">Admin login</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
