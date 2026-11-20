"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useSyncExternalStore } from "react";
import { HeroConstellation } from "@/components/sections/hero-constellation";

/**
 * Chooses the hero background.
 *
 * WebGL available → the 3D network, split into its own chunk so three.js
 * loads after the headline has painted. No WebGL, or the renderer fails to
 * start → the CSS-only SVG constellation, which needs nothing.
 *
 * Nothing renders on the server: the 3D scene fades in once its first frame
 * is drawn, and rendering the SVG first would flash one background into the
 * other.
 */
const HeroNetwork = dynamic(
  () => import("@/components/sections/hero-network").then((m) => m.HeroNetwork),
  { ssr: false, loading: () => null },
);

let webglSupported: boolean | undefined;

function detectWebGL(): boolean {
  if (webglSupported === undefined) {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      webglSupported = gl !== null;
      // Release the probe context; browsers cap how many can be alive.
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webglSupported = false;
    }
  }
  return webglSupported;
}

const noopSubscribe = () => () => {};

export function Hero3D() {
  const mode = useSyncExternalStore(
    noopSubscribe,
    () => (detectWebGL() ? "webgl" : "svg"),
    () => "pending" as const,
  );
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);

  if (mode === "pending") return null;
  if (mode === "svg" || failed) return <HeroConstellation />;
  return <HeroNetwork onError={onError} />;
}
