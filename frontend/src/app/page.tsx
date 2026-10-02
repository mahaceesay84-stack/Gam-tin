import {
  ArrowRight, BadgeCheck, ClipboardCheck, CreditCard, FileUp, GraduationCap, Lock, ShieldCheck, Smartphone, UserCheck,
} from "lucide-react";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";

const STEPS = [
  { icon: UserCheck, title: "Verify", text: "Create your account and confirm your student record." },
  { icon: FileUp, title: "Clear", text: "Pick clearance categories and upload your documents." },
  { icon: CreditCard, title: "Pay", text: "Settle the digital service fee with mobile money." },
  { icon: BadgeCheck, title: "Get approved", text: "Staff review your submission and notify you instantly." },
  { icon: GraduationCap, title: "Proceed", text: "Continue to the official UTG Students' Portal for course registration." },
];

const FEATURES = [
  { icon: ClipboardCheck, title: "One guided flow", text: "A four-step form replaces the paper trail across offices." },
  { icon: Smartphone, title: "Pay from your phone", text: "Wave, Mobile Money, QMoney and Afrimoney supported." },
  { icon: ShieldCheck, title: "Secure & traceable", text: "Every action is logged and your documents stay private." },
];

const FAQ = [
  { q: "Does this replace the UTG Students' Portal?", a: "No. Clearance is the step before it. Once approved, you continue to the official portal to complete course registration." },
  { q: "How much is the digital service fee?", a: "A single flat fee, shown in full before you pay. There are no hidden charges and the amount is set by the university." },
  { q: "Is this an official UTG service?", a: "This is a prototype. No real money moves and it is not yet an official UTG service." },
];

export default function Home() {
  return (
    <div className="space-y-20">
      <section className="hero-glow relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-14 text-center shadow-card sm:px-12 sm:py-20">
        <div className="relative flex flex-col items-center">
          <BrandMark className="h-24 w-24 sm:h-28 sm:w-28" />
          <span className="badge mt-8">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Prototype · Not an official UTG service
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Student clearance, <span className="text-brand-600 dark:text-brand-200">without the queues.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
            Verify, upload documents, pay the digital service fee and track approval, all from your phone.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn btn-primary h-11 px-6">
              Start Clearance <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn btn-secondary h-11 px-6">Student Login</Link>
            <Link href="/admin/login" className="btn btn-ghost h-11">Staff Portal</Link>
          </div>
          <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted">
            <Lock className="h-3.5 w-3.5" /> Documents stay private and every action is logged.
          </p>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card card-hover">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="section-title mt-5">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </section>

      <section>
        <p className="eyebrow">How it works</p>
        <h2 className="mt-2 text-2xl font-bold">Five steps from signup to the official portal</h2>
        <ol className="mt-10 grid gap-8 lg:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="group relative flex gap-4 lg:block">
              {i < STEPS.length - 1 && (
                <span aria-hidden className="absolute -bottom-6 left-5 top-12 w-px bg-line lg:-right-6 lg:bottom-auto lg:left-12 lg:top-5 lg:h-px lg:w-auto" />
              )}
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-slate-500 shadow-card transition-colors duration-200 group-hover:border-brand-500 group-hover:bg-brand-600 group-hover:text-white dark:text-slate-300">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div className="lg:mt-4">
                <p className="text-xs font-semibold tabular-nums text-muted">Step {i + 1}</p>
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <p className="eyebrow">Good to know</p>
        <h2 className="mt-2 text-2xl font-bold">Clear answers before you start</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="card">
              <h3 className="text-sm font-semibold text-ink">{q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
