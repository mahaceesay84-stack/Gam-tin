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
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="crest">
          <Image src="/utg-crest.jpg" alt="UTG crest" width={89} height={64} priority className="h-16 w-auto" />
        </span>
        <h1 className="page-title mt-6">{title}</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
      </div>
      <div className="card">{children}</div>
    </div>
  );
}
