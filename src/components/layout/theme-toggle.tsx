"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useIsHydrated } from "@/lib/hooks";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Theme is unknown until hydration; render a stable placeholder until then
  // so server and client markup match.
  const mounted = useIsHydrated();

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} theme` : "Toggle theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="grid h-9 w-9 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  );
}
