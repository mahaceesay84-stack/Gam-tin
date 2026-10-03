/* eslint-disable @next/next/no-img-element */
export default function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  const alt = "University of The Gambia Crest";
  return (
    <>
      <img src="/utg-crest.png" alt={alt} className={`${className} object-contain dark:hidden`} />
      {/* Crest has a white backing: present it as a round medallion on dark surfaces. */}
      <span
        className={`${className} hidden shrink-0 overflow-hidden rounded-full bg-white p-[3%] shadow-pop ring-1 ring-white/20 dark:inline-block`}
      >
        <img
          src="/utg-crest-motto.jpg"
          alt={alt}
          className="h-full w-full rounded-full object-contain"
        />
      </span>
    </>
  );
}
