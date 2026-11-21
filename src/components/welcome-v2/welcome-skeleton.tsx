/**
 * The guest welcome while its data loads: the hero's centred stack (eyebrow,
 * two-line headline, pitch, two buttons, status pill) over the photo frame,
 * with the same full-bleed wrapper, paddings and frame ratio as HeroV2.
 */
export function WelcomeSkeleton() {
  return (
    <div aria-busy="true" className="full-bleed -my-8 sm:-my-10">
      <p className="sr-only" role="status">
        Loading Hiatus…
      </p>
      <div aria-hidden="true" className="pb-16 pt-12 sm:pt-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4">
          <div className="skeleton h-3 w-28 rounded-sm" />
          {/* Two headline lines at the hero's clamp size. */}
          <div className="skeleton mt-5 h-[clamp(3rem,1.3rem+7vw,7.8rem)] w-[min(90%,40rem)] rounded-xl" />
          <div className="skeleton mt-2 h-[clamp(3rem,1.3rem+7vw,7.8rem)] w-[min(45%,18rem)] rounded-xl" />
          <div className="skeleton mt-snug h-5 w-[min(90%,26rem)] rounded-sm" />
          <div className="skeleton mt-2 h-5 w-[min(70%,18rem)] rounded-sm" />
          <div className="mt-stack flex gap-3">
            <div className="skeleton h-12 w-40 rounded-md" />
            <div className="skeleton h-12 w-40 rounded-md" />
          </div>
          <div className="skeleton mt-5 h-8 w-52 rounded-full" />
        </div>
        <div className="mx-auto mt-12 max-w-4xl px-6 sm:px-10">
          <div className="matte -rotate-1">
            <div className="skeleton aspect-[4/3] rounded-xl sm:aspect-[16/10]" />
          </div>
        </div>
      </div>
    </div>
  );
}
