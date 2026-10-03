import { ArrowRight, FileUp, ShieldCheck, Smartphone, BadgeCheck } from "lucide-react";
import Link from "next/link";
import StatusMockup from "@/components/StatusMockup";

const STEPS = [
  { icon: FileUp, title: "Upload documents", text: "Submit your clearance forms and required department files." },
  { icon: Smartphone, title: "Pay the GMD 50 fee", text: "Settle the digital service fee securely from your phone." },
  { icon: BadgeCheck, title: "Get approved", text: "Staff review your records and clear you for official portal registration." },
];

const FAQ = [
  { q: "Does this replace the UTG Students' Portal?", a: "No. Clearance is the step before it. Once approved, you continue to the official portal to complete course registration." },
  { q: "How much is the digital service fee?", a: "A single flat fee, shown in full before you pay. There are no hidden charges and the amount is set by the university." },
  { q: "Is this an official UTG service?", a: "This is a prototype. No real money moves and it is not yet an official UTG service." },
];

export default function Home() {
  return (
    <div className="space-y-16 sm:space-y-24">
      <section className="hero-in grid items-center gap-12 py-2 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-ink">
            <span aria-hidden className="h-2 w-2 rounded-full bg-gold" />
            UTG Digital Student Services
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Student clearance, without the queues.
          </h1>
          <p className="mt-4 text-lg text-muted">
            Upload your documents, pay the GMD 50 service fee from your phone, and track every department&apos;s approval in one place.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:justify-start sm:justify-center">
            <Link href="/register" className="btn btn-primary btn-lg">
              Start Clearance <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg">
              Student Login
            </Link>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-base text-muted">
            <ShieldCheck aria-hidden className="h-5 w-5 shrink-0" />
            Your documents stay private and every action is logged.
          </p>
        </div>
        <StatusMockup />
      </section>

      <section aria-labelledby="how-title">
        <p className="eyebrow">How it works</p>
        <h2 id="how-title" className="mt-2 text-2xl font-bold text-ink">Three steps to clearance</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="card flex gap-4">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-base font-bold text-white dark:bg-navy-600">
                {i + 1}
                <span aria-hidden className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-gold dark:border-[#0b1f4b]" />
              </span>
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
                  <Icon aria-hidden className="h-5 w-5 text-muted" /> {title}
                </h3>
                <p className="mt-1 text-base text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq-title">
        <p className="eyebrow">Good to know</p>
        <h2 id="faq-title" className="mt-2 text-2xl font-bold text-ink">Clear answers before you start</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="card">
              <h3 className="text-lg font-semibold text-ink">{q}</h3>
              <p className="mt-2 text-base text-muted">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
