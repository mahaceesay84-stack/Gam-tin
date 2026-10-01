import Link from "next/link";

const STEPS = [
  ["Verify", "Create your account and confirm your student record."],
  ["Clear", "Select your clearance categories and upload documents."],
  ["Pay", "Pay the small digital service fee with mobile money."],
  ["Get approved", "Staff review your submission and notify you instantly."],
  ["Proceed", "Continue to the official UTG portal to finish up."],
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-brand px-6 py-14 text-center text-white">
        <h1 className="text-4xl font-bold">UTG Digital Student Services</h1>
        <p className="mx-auto mt-3 max-w-xl text-green-100">
          Complete your graduation clearance online — no queues, no paperwork runs across campus.
        </p>
        <p className="mx-auto mt-4 inline-block rounded bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
          Prototype — Not an official UTG service.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="btn bg-white text-brand hover:bg-green-50">
            Create student account
          </Link>
          <Link href="/login" className="btn border border-white text-white hover:bg-brand-dark">
            Student login
          </Link>
          <Link href="/admin/login" className="btn border border-white/60 text-white hover:bg-brand-dark">
            Admin login
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-5">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="card">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {i + 1}
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
