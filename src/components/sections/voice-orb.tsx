"use client";

/**
 * The voice agent's body: a liquid sphere whose surface is displaced by 3D
 * noise, wrapped in a wireframe shell and a ring of orbiting particles.
 *
 * It is driven by two refs rather than props so the parent never re-renders
 * per frame:
 *  - `stateRef` picks the mood — idle breathes, listening turns cyan and
 *    follows the microphone, thinking spins up, speaking pulses per word.
 *  - `levelRef` is instantaneous energy, 0–1. The microphone writes it while
 *    listening; word-boundary events set it while speaking, and it decays
 *    here between words.
 */

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

/* Ashima Arts / Stefan Gustavson 3D simplex noise (MIT). */
const noise = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
`;

const orbVertex = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uFreq;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vDisp;
  ${noise}
  void main() {
    float n = snoise(normal * uFreq + vec3(uTime * 0.35, uTime * 0.22, -uTime * 0.18));
    float detail = snoise(normal * uFreq * 2.0 - uTime * 0.6) * 0.2;
    float disp = (n + detail) * uAmp;
    vDisp = disp;
    vec3 displaced = position + normal * disp;
    vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const orbFragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vDisp;
  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.4);
    float mixer = clamp(0.5 + vDisp * 2.4 + fresnel * 0.35, 0.0, 1.0);
    vec3 color = mix(uColorA, uColorB, mixer) * (0.55 + fresnel * 1.1);
    gl_FragColor = vec4(color, (0.32 + fresnel * 0.68) * uOpacity);
    #include <colorspace_fragment>
  }
`;

const particleVertex = /* glsl */ `
  uniform float uPixelRatio;
  attribute float aSize;
  varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (18.0 / -mv.z);
    vFade = smoothstep(7.5, 3.5, -mv.z);
  }
`;

const particleFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(uColor, pow(1.0 - d * 2.0, 1.6) * uOpacity * (0.35 + vFade));
    #include <colorspace_fragment>
  }
`;

/** Per-state targets the scene eases toward. */
const MOODS: Record<VoiceState, { amp: number; freq: number; spin: number; scale: number }> = {
  idle: { amp: 0.09, freq: 1.4, spin: 0.25, scale: 1 },
  listening: { amp: 0.12, freq: 1.8, spin: 0.4, scale: 1.04 },
  thinking: { amp: 0.11, freq: 1.9, spin: 2.2, scale: 0.96 },
  speaking: { amp: 0.12, freq: 1.6, spin: 0.6, scale: 1.05 },
};

export function VoiceOrb({
  stateRef,
  levelRef,
}: {
  stateRef: RefObject<VoiceState>;
  levelRef: RefObject<number>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0, 5.2);
    const root = new THREE.Group();
    scene.add(root);

    // Liquid core.
    const orbGeo = new THREE.IcosahedronGeometry(1, 48);
    const orbMat = new THREE.ShaderMaterial({
      vertexShader: orbVertex,
      fragmentShader: orbFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uAmp: { value: MOODS.idle.amp },
        uFreq: { value: MOODS.idle.freq },
        uColorA: { value: new THREE.Color() },
        uColorB: { value: new THREE.Color() },
        uOpacity: { value: 1 },
      },
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    root.add(orb);

    // Wireframe shell, slightly larger, turning against the core.
    const shellGeo = new THREE.IcosahedronGeometry(1.32, 2);
    const shellMat = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, depthWrite: false });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    root.add(shell);

    // Particle rings on two tilted planes.
    const COUNT = 520;
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2 * 3.0;
      const band = i % 2 === 0 ? 1.75 : 2.05;
      const r = band + Math.sin(i * 12.9898) * 0.09;
      const y = Math.sin(i * 78.233) * 0.06;
      positions.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
      sizes[i] = 0.8 + ((Math.sin(i * 3.7) + 1) / 2) * 1.6;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    const particleMat = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color() },
        uOpacity: { value: 0.8 },
        uPixelRatio: { value: pixelRatio },
      },
    });
    const ring = new THREE.Points(particleGeo, particleMat);
    ring.rotation.set(0.42, 0, 0.18);
    root.add(ring);

    /* ---------------------------------------------------------- theme */
    const palette = { accent: new THREE.Color(), accent2: new THREE.Color(), white: new THREE.Color("#ffffff") };
    let dark = true;
    const applyTheme = () => {
      const css = getComputedStyle(document.documentElement);
      const read = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
      dark = document.documentElement.classList.contains("dark");
      palette.accent.set(read("--accent", "#7c8cff"));
      palette.accent2.set(read("--accent-2", "#22d3ee"));
      const blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      for (const m of [orbMat, shellMat, particleMat]) {
        m.blending = blending;
        m.needsUpdate = true;
      }
      shellMat.opacity = dark ? 0.12 : 0.2;
      orbMat.uniforms.uOpacity!.value = dark ? 1 : 0.9;
    };
    applyTheme();
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    /* --------------------------------------------------------- layout */
    const layout = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = `${width}px`;
      renderer.domElement.style.height = `${height}px`;
      camera.aspect = width / height;
      // As a small avatar the whole body, rings included, must fit the frame.
      camera.position.z = width < 160 ? 7.4 : 5.2;
      camera.updateProjectionMatrix();
    };

    /* ----------------------------------------------------------- loop */
    const colorA = new THREE.Color();
    const colorB = new THREE.Color();
    const targetA = new THREE.Color();
    const targetB = new THREE.Color();
    let level = 0;
    let time = 0;
    let raf = 0;
    let running = false;
    let last = performance.now();

    const frame = (dt: number) => {
      const state = stateRef.current ?? "idle";
      const mood = MOODS[state];

      // Energy: speaking decays between words; listening is overwritten by
      // the mic every frame, so the decay is harmless there.
      const raw = levelRef.current ?? 0;
      if (state === "speaking") {
        levelRef.current = raw * 0.9;
      }
      const target = state === "speaking" ? Math.max(raw, 0.18 + Math.sin(time * 7) * 0.06) : raw;
      level += (target - level) * 0.25;

      time += dt * (1 + level * 0.8);
      orbMat.uniforms.uTime!.value = time;
      const amp = orbMat.uniforms.uAmp!.value as number;
      orbMat.uniforms.uAmp!.value = amp + (mood.amp + Math.min(level, 1) * 0.14 - amp) * 0.12;
      const freq = orbMat.uniforms.uFreq!.value as number;
      orbMat.uniforms.uFreq!.value = freq + (mood.freq - freq) * 0.05;

      // Colour by mood.
      if (state === "listening") {
        targetA.copy(palette.accent2);
        targetB.copy(palette.accent2).lerp(palette.white, dark ? 0.35 : 0);
      } else if (state === "thinking") {
        targetA.copy(palette.accent);
        targetB.copy(palette.accent).lerp(palette.accent2, 0.5);
      } else if (state === "speaking") {
        targetA.copy(palette.accent);
        targetB.copy(palette.accent2).lerp(palette.white, dark ? 0.25 : 0);
      } else {
        targetA.copy(palette.accent);
        targetB.copy(palette.accent2);
      }
      colorA.lerp(targetA, 0.06);
      colorB.lerp(targetB, 0.06);
      orbMat.uniforms.uColorA!.value.copy(colorA);
      orbMat.uniforms.uColorB!.value.copy(colorB);
      shellMat.color.copy(colorA);
      particleMat.uniforms.uColor!.value.copy(colorB);

      const s = root.scale.x;
      root.scale.setScalar(s + (mood.scale + level * 0.08 - s) * 0.08);
      orb.rotation.y += dt * 0.15;
      shell.rotation.y -= dt * mood.spin * 0.3;
      shell.rotation.x += dt * 0.07;
      ring.rotation.y += dt * mood.spin * 0.35;

      renderer.render(scene, camera);
    };

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      frame(dt);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      if (reducedMotion) {
        // Settle colours first so the still frame is not black.
        colorA.copy(palette.accent);
        colorB.copy(palette.accent2);
        frame(0);
        return;
      }
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    colorA.copy(palette.accent);
    colorB.copy(palette.accent2);
    const resizeObserver = new ResizeObserver(() => {
      layout();
      if (!running) frame(0);
    });
    resizeObserver.observe(container);
    layout();

    const visibility = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) start();
      else stop();
    });
    visibility.observe(container);
    container.style.opacity = "1";

    return () => {
      stop();
      visibility.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      for (const g of [orbGeo, shellGeo, particleGeo]) g.dispose();
      for (const m of [orbMat, shellMat, particleMat]) m.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [stateRef, levelRef]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="absolute inset-0 opacity-0 transition-opacity duration-1000"
    />
  );
}
