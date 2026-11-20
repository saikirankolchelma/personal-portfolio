"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import type { PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

const spring = { stiffness: 220, damping: 22, mass: 0.6 };

/**
 * Leans its child toward the pointer in 3D, with a soft light that follows
 * the cursor across the surface.
 *
 * Mouse only: touch has no hover, and tilting under a finger would fight the
 * scroll. Reduced motion leaves the card flat.
 */
export function Tilt({
  children,
  className,
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  /** Peak rotation in degrees at the card's edge. */
  max?: number;
}) {
  const reduced = useReducedMotion();
  const rotateX = useSpring(0, spring);
  const rotateY = useSpring(0, spring);
  const lightX = useMotionValue(50);
  const lightY = useMotionValue(50);
  const lightOpacity = useSpring(0, spring);
  const light = useMotionTemplate`radial-gradient(420px circle at ${lightX}% ${lightY}%, var(--glow), transparent 65%)`;

  // The markup is identical whether or not motion is reduced: the server
  // cannot know the preference, so branching the tree would break hydration.
  // Reduced motion simply never sets the values.
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 2 * max);
    rotateX.set(-(py - 0.5) * 2 * max);
    lightX.set(px * 100);
    lightY.set(py * 100);
    lightOpacity.set(1);
  };

  const onPointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    lightOpacity.set(0);
  };

  return (
    <div
      className={cn("[perspective:1100px]", className)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <motion.div
        className="relative h-full [transform-style:preserve-3d]"
        style={{ rotateX, rotateY }}
      >
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-[var(--radius-card)]"
          style={{ background: light, opacity: lightOpacity }}
        />
      </motion.div>
    </div>
  );
}
