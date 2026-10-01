import { ArrowRight, ClipboardCheck, ShieldCheck, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const STEPS = [
  { title: "Verify", text: "Create your account and confirm your student record." },
  { title: "Clear", text: "Pick your clearance categories and upload documents." },
  { title: "Pay", text: "Settle the small digital service fee with mobile money." },
  { title: "Get approved", text: "Staff review your submission and notify you instantly." },
  { title: "Proceed", text: "Continue to the official UTG Students' Portal to complete your course registration." },
];

const FEATURES = [
  { icon: ClipboardCheck, title: "One guided flow", text: "A four-step form replaces the paper trail across offices." },
  { icon: Smartphone, title: "Pay from your phone", text: "Wave, Mobile Money, QMoney and Afrimoney supported." },
  { icon: ShieldCheck, title: "Secure & traceable", text: "Every action is logged and your documents stay private." },
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="flex flex-col items-center py-8 text-center sm:py-12">
        <span className="crest p-4 shadow-card">
          <Image src="/utg-crest.jpg" alt="UTG crest" width={267} height={192} priority className="h-44 w-auto sm:h-48" />
        </span>
        <p className="eyebrow mt-10">Prototype — Not an official UTG service.</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">UTG Digital Student Services</h1>
        <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
          Complete your student clearance online, from wherever you are.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register" className="btn btn-primary">
            Create student account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Student login
          </Link>
          <Link href="/admin/login" className="btn btn-ghost">
            Staff login
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card card-hover">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-slate-500 dark:text-slate-400">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="section-title mt-5">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </section>

      <section>
        <p className="eyebrow">How it works</p>
        <h2 className="section-title mt-2">Five steps from signup to the official portal</h2>
        <ol className="mt-8 grid gap-8 lg:grid-cols-5">
          {STEPS.map(({ title, text }, i) => (
            <li key={title} className="relative flex gap-4 lg:block">
              {i < STEPS.length - 1 && (
                <span aria-hidden className="absolute -bottom-6 left-4 top-10 w-px bg-line lg:-right-6 lg:bottom-auto lg:left-10 lg:top-4 lg:h-px lg:w-auto" />
              )}
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-sm font-semibold tabular-nums text-ink">
                {i + 1}
              </span>
              <div className="lg:mt-4">
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
