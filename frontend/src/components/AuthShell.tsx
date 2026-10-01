import Image from "next/image";

export default function AuthShell({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`animate-in mx-auto ${wide ? "max-w-xl" : "max-w-md"}`}>
      <div className="mb-6 text-center">
        <span className="mx-auto flex w-fit rounded-xl bg-white p-2 shadow-card ring-1 ring-black/5">
          <Image src="/utg-crest.jpg" alt="UTG crest" width={89} height={64} priority className="h-16 w-auto" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      <div className="card p-7 shadow-pop">{children}</div>
    </div>
  );
}
