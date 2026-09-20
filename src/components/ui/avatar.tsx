import Image from "next/image";
import { profile } from "@/content/profile";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-28 w-28 sm:h-32 sm:w-32",
  md: "h-40 w-40 sm:h-48 sm:w-48 lg:h-56 lg:w-56",
  lg: "h-44 w-44 sm:h-56 sm:w-56 lg:h-64 lg:w-64",
} as const;

/** Rendered width in px per size, for the `sizes` hint. */
const widthHint = {
  sm: "128px",
  md: "224px",
  lg: "256px",
} as const;

/**
 * Circular portrait with a gradient ring.
 *
 * The source is a tall portrait, so a square crop centred by default would cut
 * off the top of the head and fill the circle with chest. `object-position`
 * pulls the crop upward to sit the face in the middle of the frame.
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
      {/* Accent bloom, sitting behind and slightly larger than the ring. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-full opacity-70 blur-2xl"
        style={{
          background: "radial-gradient(closest-side, var(--glow), transparent 70%)",
        }}
      />

      {/* Gradient ring, with a bg-coloured gap so it reads as a ring rather
          than a border sitting directly on the photo. */}
      <div
        className={cn(
          "relative rounded-full p-[2.5px]",
          "bg-[linear-gradient(140deg,var(--accent),var(--accent-2))]",
          "shadow-[0_18px_50px_-20px_var(--glow)]",
        )}
      >
        <div className="rounded-full bg-bg p-1">
          <div className={cn("relative overflow-hidden rounded-full", sizes[size])}>
            <Image
              src="/sai-kiran.jpg"
              alt={`${profile.name}, ${profile.title}`}
              fill
              priority={priority}
              sizes={widthHint[size]}
              className="object-cover"
              // Faces sit high in a portrait crop; centre on the face, not the torso.
              style={{ objectPosition: "center 18%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
