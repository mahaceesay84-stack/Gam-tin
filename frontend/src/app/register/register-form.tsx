"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input, PasswordInput, Select } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api";
import { normalizePhone, registerSchema, type RegisterValues } from "@/lib/schemas/register";

const FIELD_MAP: Record<string, keyof RegisterValues> = {
  full_name: "fullName",
  email: "email",
  phone: "phone",
  student_number: "studentNumber",
  level: "level",
  programme: "programme",
  password: "password",
};

const LEVELS = [1, 2, 3, 4, 5, 6];

type ProgrammeOption = { id: number; name: string; faculty_name: string };

export default function RegisterForm({ programmes, loadFailed }: { programmes: ProgrammeOption[]; loadFailed: boolean }) {
  const groups = new Map<string, ProgrammeOption[]>();
  for (const p of programmes) groups.set(p.faculty_name, [...(groups.get(p.faculty_name) ?? []), p]);
  const sortedGroups = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([faculty, ps]) => [faculty, [...ps].sort((a, b) => a.name.localeCompare(b.name))] as const);
  const unavailable = loadFailed || programmes.length === 0;
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: { fullName: "", email: "", phone: "", studentNumber: "", level: "", programme: "", password: "" },
  });

  async function onSubmit(v: RegisterValues) {
    setFormError("");
    try {
      await api.post("/auth/register/", {
        full_name: v.fullName,
        email: v.email,
        phone: normalizePhone(v.phone),
        student_number: v.studentNumber,
        level: Number(v.level),
        programme: Number(v.programme),
        password: v.password,
      });
      router.push("/login?registered=1");
    } catch (err) {
      if (err instanceof ApiError) {
        const unmapped: string[] = [];
        for (const [k, msgs] of Object.entries(err.fieldErrors ?? {})) {
          const name = FIELD_MAP[k];
          if (name) setError(name, { message: msgs[0] });
          else unmapped.push(msgs[0]);
        }
        if (unmapped.length) setFormError(unmapped.join(" "));
        else if (!err.fieldErrors) setFormError(err.message);
      } else {
        setFormError("We couldn't reach the server. Check your connection and try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <Input label="Full name" autoComplete="name" inputMode="text" error={errors.fullName?.message} {...register("fullName")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="Mobile number"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          hint="e.g. 87 123 4567 or +220 87 123 4567"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input label="Student number" autoComplete="off" inputMode="numeric" error={errors.studentNumber?.message} {...register("studentNumber")} />
        <Select label="Level" placeholder="Select level" error={errors.level?.message} {...register("level")}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              Level {l}
            </option>
          ))}
        </Select>
      </div>
      <Select label="Programme" placeholder="Select programme" error={errors.programme?.message} {...register("programme")}>
        {sortedGroups.map(([faculty, ps]) => (
          <optgroup key={faculty} label={faculty}>
            {ps.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
      <PasswordInput
        label="Password"
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a number."
        error={errors.password?.message}
        {...register("password")}
      />

      {unavailable && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Programmes couldn&apos;t be loaded. Refresh the page.</span>
        </div>
      )}

      {formError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || unavailable}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-xs text-slate-600 dark:text-slate-300">
        By creating an account you agree to the Terms and Privacy Policy.
      </p>
      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        Already registered?{" "}
        <Link href="/login" className="link">
          Log in
        </Link>
      </p>
    </form>
  );
}
