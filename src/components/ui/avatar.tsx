import Image from "next/image";
import { profile } from "@/content/profile";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-32 w-32 sm:h-36 sm:w-36",
  md: "h-48 w-48 sm:h-56 sm:w-56 lg:h-64 lg:w-64",
  lg: "h-56 w-56 sm:h-64 sm:w-64 lg:h-80 lg:w-80",
} as const;

/** Largest rendered width in px per size, for the `sizes` hint. */
const widthHint = {
  sm: "144px",
  md: "256px",
  lg: "320px",
} as const;

/**
 * Circular portrait.
 *
 * Deliberately restrained: two hairline rings with a gap between them, and a
 * low-opacity bloom. A saturated gradient ring competes with the face for
 * attention and reads as decoration — on a portfolio the photo should look
 * like a headshot, not an avatar frame.
 *
 * The source is a tall portrait, so a square crop centred by default would
 * clip the top of the head and fill the circle with jacket. `object-position`
 * pulls the frame up to sit the face centrally.
 */
export function Avatar({
  size = "md",
  priority = false,
  className,
}: {
  size?: keyof typeof sizes;
  /** True only above the fold, so it is not lazy-loaded. */
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative inline-block", className)}>
      {/* Ambient light behind the portrait — present, but not a halo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 rounded-full opacity-45 blur-3xl"
        style={{
          background: "radial-gradient(closest-side, var(--glow), transparent 70%)",
        }}
      />

      {/* Outer hairline, offset by the padding to read as a ring. */}
      <div className="relative rounded-full p-2 ring-1 ring-border">
        <div
          className={cn(
            "relative overflow-hidden rounded-full",
            "ring-1 ring-border-strong",
            "shadow-[0_20px_60px_-24px_rgba(0,0,0,0.55)]",
            sizes[size],
          )}
        >
          <Image
            src="/sai-kiran.jpg"
            alt={`${profile.name}, ${profile.title}`}
            fill
            priority={priority}
            sizes={widthHint[size]}
            className="object-cover"
            style={{ objectPosition: "center 18%" }}
          />

          {/* Faint vignette, so the photo's own grey background settles into
              the page instead of ending at a hard circular edge. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              boxShadow: "inset 0 -30px 45px -30px rgba(0,0,0,0.65)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
