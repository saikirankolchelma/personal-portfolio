import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats "Sep 2025" + null into "Sep 2025 — Present". */
export function formatPeriod(start: string, end: string | null) {
  return `${start} — ${end ?? "Present"}`;
}
