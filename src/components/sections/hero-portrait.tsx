import Image from "next/image";
import { profile } from "@/content/profile";

const CUTOUT = "/sai-kiran-cutout.webp";

/**
 * The hero portrait as a hologram.
 *
 * The photo is a background-removed cut-out (public/sai-kiran-cutout.webp,
 * graded with an indigo/cyan rim light to match the palette). Its shoulders
 * sit inside a circle while the head rises out of the top, so the subject
 * stands in front of the 3D network instead of sitting in a frame beside it.
 *
 * Layers, back to front: bloom, spectral ring, disc, cut-out, scan line
 * (masked to the cut-out's own silhouette so it never sweeps empty space),
 * status pill. The disc carries `data-hero-anchor`, which the 3D scene uses
 * to centre itself.
 */
export function HeroPortrait() {
  return (
    // Top padding makes room for the head, which rises 35% of the disc's
    // width above it (15rem → 5.25rem, 18rem → 6.3rem, 20rem → 7rem).
    <div className="relative pt-20 sm:pt-24 lg:pt-28">
      <div
        data-hero-anchor
        className="relative aspect-square w-60 sm:w-72 lg:w-80"
      >
        {/* Bloom */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-12 rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--glow), transparent 72%)" }}
        />

        {/* Spectral ring, and a slower dashed orbit outside it. */}
        <div aria-hidden className="portrait-ring absolute -inset-2.5 rounded-full opacity-80 animate-orbit-slow" />
        <div
          aria-hidden
          className="absolute -inset-6 rounded-full border border-dashed border-accent/25 animate-orbit-fast"
        />

        {/* Disc */}
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden rounded-full border border-border-strong"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, var(--accent-soft), transparent 70%), linear-gradient(to bottom, var(--surface-2), var(--bg-subtle))",
          }}
        >
          <div className="absolute inset-0 grid-bg opacity-70" />
        </div>

        {/* Cut-out: rectangular above the disc's equator, round below it, so
            the head clears the top while the shoulders follow the circle. */}
        <div className="absolute inset-x-0 bottom-0 h-[135%] overflow-hidden rounded-b-full">
          <Image
            src={CUTOUT}
            alt={`${profile.name}, ${profile.title}`}
            width={720}
            height={1223}
            priority
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 270px, 225px"
            className="absolute left-1/2 top-0 h-auto w-[92%] max-w-none -translate-x-1/2"
          />
          <div
            aria-hidden
            className="absolute left-1/2 top-0 w-[92%] -translate-x-1/2 overflow-hidden"
            style={{
              aspectRatio: "720 / 1223",
              WebkitMaskImage: `url(${CUTOUT})`,
              maskImage: `url(${CUTOUT})`,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
            }}
          >
            <div className="portrait-scan absolute inset-x-0 top-0 h-[18%]" />
          </div>
        </div>

        {/* Status pill */}
        <div className="absolute -bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-border-strong bg-surface/85 px-3.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-muted shadow-lg backdrop-blur">
          <span className="relative grid h-2 w-2 place-items-center">
            <span className="absolute h-2 w-2 rounded-full bg-accent-2 animate-pulse-ring" />
            <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
          </span>
          Agents online
        </div>
      </div>
    </div>
  );
}
