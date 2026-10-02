import {
  ArrowRight, BadgeCheck, ClipboardCheck, Clock, CreditCard, FileUp, GraduationCap, ShieldCheck, Smartphone, UserCheck,
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
      <section className="grid items-center gap-10 py-6 sm:py-10 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-left">
          <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start sm:justify-center">
            <BrandMark className="h-14 w-14" />
            <span className="inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
              Prototype — not an official UTG service
            </span>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Student clearance, without the queues.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg lg:mx-0">
            Submit documents, pay the digital service fee from your phone and track approval online, from wherever you are.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link href="/register" className="btn btn-primary">
              Start Clearance <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn btn-secondary">
              Student Login
            </Link>
            <Link href="/admin/login" className="btn btn-ghost">
              Staff Portal
            </Link>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted lg:justify-start">
            <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" />
            Your documents stay private and every action is logged.
          </p>
        </div>

        <figure className="relative mx-auto h-72 w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface shadow-pop sm:h-96 lg:h-[420px] lg:max-w-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-queue.jpg"
            alt="Students waiting in a long in-person queue"
            className="h-full w-full object-cover object-top"
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/70 to-transparent" />
          <figcaption className="absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              The old way: in-person hallway queues
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-card">
              <Clock className="h-3.5 w-3.5 text-brand-600" /> Online clearance: ~5 mins
            </span>
          </figcaption>
        </figure>
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
