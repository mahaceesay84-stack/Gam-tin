/* eslint-disable @next/next/no-img-element */
export default function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  const alt = "UTG Digital Student Services logo";
  return (
    <>
      <img src="/brand/logo-mark.svg" alt={alt} className={`${className} dark:hidden`} />
      <img src="/brand/logo-mark-dark.svg" alt={alt} className={`${className} hidden dark:block`} />
    </>
  );
}
