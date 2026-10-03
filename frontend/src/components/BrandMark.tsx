/* eslint-disable @next/next/no-img-element */
export default function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img
      src="/utg-crest.png"
      alt="University of The Gambia Crest"
      className={`${className} object-contain`}
    />
  );
}
