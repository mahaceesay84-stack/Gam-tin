import { ArrowRight, BadgeCheck, ClipboardCheck, CreditCard, FileUp, GraduationCap, ShieldCheck, Smartphone, UserCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const STEPS = [
  { icon: UserCheck, title: "Verify", text: "Create your account and confirm your student record." },
  { icon: FileUp, title: "Clear", text: "Pick your clearance categories and upload documents." },
  { icon: CreditCard, title: "Pay", text: "Settle the small digital service fee with mobile money." },
  { icon: BadgeCheck, title: "Get approved", text: "Staff review your submission and notify you instantly." },
  { icon: GraduationCap, title: "Proceed", text: "Continue to the official UTG portal to finish up." },
];

const FEATURES = [
  { icon: ClipboardCheck, title: "One guided flow", text: "A four-step form replaces the paper trail across offices." },
  { icon: Smartphone, title: "Pay from your phone", text: "Wave, Mobile Money, QMoney and Afrimoney supported." },
  { icon: ShieldCheck, title: "Secure & traceable", text: "Every action is logged and your documents stay private." },
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 px-6 py-16 text-center text-white shadow-pop sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="relative">
          <div className="mx-auto mb-6 flex w-fit rounded-2xl bg-white p-3 shadow-lg">
            <Image src="/utg-crest.jpg" alt="UTG crest" width={133} height={96} priority className="h-24 w-auto drop-shadow-md" />
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-300/95 px-4 py-1.5 text-xs font-semibold text-amber-950">
            Prototype — Not an official UTG service.
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            UTG Digital Student Services
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-brand-100 sm:text-lg">
            Complete your graduation clearance online — no queues, no running between offices.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn bg-white px-6 py-3 text-brand-800 shadow-md hover:bg-brand-50">
              Create student account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn border border-white/40 px-6 py-3 text-white hover:bg-white/10">
              Student login
            </Link>
            <Link href="/admin/login" className="btn px-6 py-3 text-brand-100 hover:bg-white/10">
              <ShieldCheck className="h-4 w-4" /> Staff login
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card transition hover:-translate-y-0.5 hover:shadow-pop">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </section>

      <section>
        <p className="eyebrow">How it works</p>
        <h2 className="mt-1 text-2xl font-bold">Five steps from signup to the official portal</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="card relative p-5">
              <span className="absolute right-4 top-4 text-3xl font-extrabold text-slate-100 dark:text-slate-800">{i + 1}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
