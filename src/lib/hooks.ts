"use client";

import { useCallback, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * False during SSR and the hydration pass, true afterwards.
 *
 * `useSyncExternalStore` is the right tool here rather than a `useState` +
 * `useEffect` mounted flag: it gives React an explicit server snapshot, so
 * there is no hydration mismatch and no cascading render.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Reads a number out of localStorage as an external store.
 *
 * localStorage is genuinely external state that can be absent or throw
 * (private windows, blocked site data), so every access is guarded and the
 * server snapshot falls back to `fallback`.
 */
export function useStoredNumber(
  key: string,
  fallback = 0,
): [number, (value: number) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    // `storage` fires for other tabs; same-tab writes dispatch it manually.
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);

  const getSnapshot = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }, [key, fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

  const setValue = useCallback(
    (next: number) => {
      try {
        window.localStorage.setItem(key, String(next));
        // Same-tab writes do not fire `storage`, so nudge subscribers.
        window.dispatchEvent(new StorageEvent("storage", { key }));
      } catch {
        /* storage unavailable — the caller keeps its in-memory value */
      }
    },
    [key],
  );

  return [value, setValue];
}
