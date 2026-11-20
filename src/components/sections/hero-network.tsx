"use client";

/**
 * A 3D neural network that wraps the hero portrait.
 *
 * Around 180 nodes sit in a spherical shell with an inner core, each linked
 * to its nearest neighbours. Signals random-walk the graph, and a node flares
 * briefly when one arrives, so the network looks like it is routing
 * something, not just spinning. Five specialist agents ride the orbit rings,
 * each tethered to the core by a beam that carries work out to it. The whole
 * thing turns slowly, leans toward the pointer, and rotates further as the
 * hero scrolls away.
 *
 * Constraints, in the same spirit as the SVG constellation it replaces:
 *  - Client only and lazily loaded (see hero-3d.tsx), so three.js never
 *    touches the server bundle or delays the headline paint.
 *  - The layout is seeded, not Math.random, so every visit sees the same
 *    shape.
 *  - The render loop stops while the hero is off screen, and
 *    prefers-reduced-motion draws one still frame and no loop.
 *  - Colours come from the CSS tokens and re-read when the theme class
 *    changes, so light and dark both look intentional.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ----------------------------------------------------------------- data */

/** Small, fast, seedable PRNG — deterministic layout without a dependency. */
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SHELL_NODES = 150;
const CORE_NODES = 28;
const NEIGHBOURS = 3;
const SIGNALS = 26;
const DUST = 260;

/** Specialist agents orbiting the network. Even indices ride the inner ring. */
const AGENTS = ["Planner", "Retriever", "MCP tools", "Evaluator", "Voice agent"] as const;

type Network = {
  positions: Float32Array;
  sizes: Float32Array;
  edges: [number, number][];
  adjacency: number[][];
};

function buildNetwork(): Network {
  const rand = mulberry32(20261120);
  const points: THREE.Vector3[] = [];

  // Fibonacci sphere for even coverage, with radial jitter so it reads as a
  // volume with depth rather than a hollow ball.
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < SHELL_NODES; i++) {
    const y = 1 - (i / (SHELL_NODES - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const shell = 0.78 + rand() * 0.3;
    points.push(
      new THREE.Vector3(Math.cos(theta) * r * shell, y * shell, Math.sin(theta) * r * shell),
    );
  }
  for (let i = 0; i < CORE_NODES; i++) {
    const v = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    points.push(v.multiplyScalar(0.18 + rand() * 0.38));
  }

  const n = points.length;
  const positions = new Float32Array(n * 3);
  const sizes = new Float32Array(n);
  points.forEach((p, i) => {
    positions.set([p.x, p.y, p.z], i * 3);
    sizes[i] = 1 + rand() * 1.6 + (i >= SHELL_NODES ? 0.6 : 0);
  });

  // k-nearest-neighbour links give a web, not a mesh.
  const seen = new Set<number>();
  const edges: [number, number][] = [];
  const adjacency: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    const nearest = points
      .map((p, j) => ({ j, d: p.distanceToSquared(points[i]!) }))
      .filter((e) => e.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, NEIGHBOURS);
    for (const { j } of nearest) {
      const key = Math.min(i, j) * n + Math.max(i, j);
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([i, j]);
      adjacency[i]!.push(j);
      adjacency[j]!.push(i);
    }
  }

  return { positions, sizes, edges, adjacency };
}

/* -------------------------------------------------------------- shaders */

const pointVertex = /* glsl */ `
  attribute float aSize;
  attribute float aGlow;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uFogNear;
  uniform float uFogFar;
  varying float vAlpha;
  varying float vGlow;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (1.0 + aGlow * 1.4) * uScale * uPixelRatio / -mv.z;
    // Far side of the sphere fades, which is most of what sells the depth.
    vAlpha = 1.0 - smoothstep(uFogNear, uFogFar, -mv.z) * 0.8;
    vGlow = aGlow;
  }
`;

const pointFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uGlowColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vGlow;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float a = pow(core, 1.8) * uOpacity * vAlpha * (1.0 + vGlow);
    gl_FragColor = vec4(mix(uColor, uGlowColor, vGlow), clamp(a, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

function pointMaterial(scale: number, opacity: number) {
  return new THREE.ShaderMaterial({
    vertexShader: pointVertex,
    fragmentShader: pointFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color() },
      uGlowColor: { value: new THREE.Color() },
      uOpacity: { value: opacity },
      uPixelRatio: { value: 1 },
      uScale: { value: scale },
      uFogNear: { value: 3 },
      uFogFar: { value: 6 },
    },
  });
}

/* ------------------------------------------------------------ component */

const CAMERA_Z = 5;
const FOV = 40;

export function HeroNetwork({ onError }: { onError?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      onError?.();
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, CAMERA_Z - 1, CAMERA_Z + 1.6);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
    camera.position.set(0, 0, CAMERA_Z);
    // Anything that must track the scene graph (the agent labels) hooks in
    // here, so a still frame under reduced motion is still correct.
    let beforeRender = () => {};
    const render = () => {
      beforeRender();
      renderer.render(scene, camera);
    };

    /* Hierarchy: anchor (placed over the portrait) → tilt (follows the
       pointer) → spin (constant rotation) → the network itself. */
    const anchor = new THREE.Group();
    const tilt = new THREE.Group();
    const spin = new THREE.Group();
    anchor.add(tilt);
    tilt.add(spin);
    scene.add(anchor);

    const net = buildNetwork();
    const nodeCount = net.sizes.length;

    // Nodes.
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(net.positions, 3));
    nodeGeo.setAttribute("aSize", new THREE.BufferAttribute(net.sizes, 1));
    const glow = new Float32Array(nodeCount);
    const glowAttr = new THREE.BufferAttribute(glow, 1);
    glowAttr.setUsage(THREE.DynamicDrawUsage);
    nodeGeo.setAttribute("aGlow", glowAttr);
    const nodeMat = pointMaterial(36, 0.95);
    spin.add(new THREE.Points(nodeGeo, nodeMat));

    // Links.
    const linkPositions = new Float32Array(net.edges.length * 6);
    net.edges.forEach(([a, b], k) => {
      linkPositions.set(net.positions.subarray(a * 3, a * 3 + 3), k * 6);
      linkPositions.set(net.positions.subarray(b * 3, b * 3 + 3), k * 6 + 3);
    });
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3));
    const linkMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
    spin.add(new THREE.LineSegments(linkGeo, linkMat));

    // Signals: each walks one edge, then picks a neighbouring edge at random.
    const rand = mulberry32(7);
    const signals = Array.from({ length: SIGNALS }, () => {
      const edge = net.edges[Math.floor(rand() * net.edges.length)]!;
      return { from: edge[0], to: edge[1], t: rand(), speed: 0.35 + rand() * 0.5 };
    });
    const signalPositions = new Float32Array(SIGNALS * 3);
    const signalGeo = new THREE.BufferGeometry();
    const signalAttr = new THREE.BufferAttribute(signalPositions, 3);
    signalAttr.setUsage(THREE.DynamicDrawUsage);
    signalGeo.setAttribute("position", signalAttr);
    signalGeo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(SIGNALS).fill(2.6), 1));
    signalGeo.setAttribute("aGlow", new THREE.BufferAttribute(new Float32Array(SIGNALS), 1));
    const signalMat = pointMaterial(36, 1);
    const signalPoints = new THREE.Points(signalGeo, signalMat);
    signalPoints.visible = !reducedMotion;
    spin.add(signalPoints);

    // Orbit rings, tilted against each other — a cheap, strong depth cue.
    const ringGeo = new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(0, 0, 1.38, 1.38, 0, Math.PI * 2).getPoints(160),
    );
    const ringMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
    const ringA = new THREE.LineLoop(ringGeo, ringMat);
    ringA.rotation.set(Math.PI * 0.3, 0.35, 0);
    const ringB = new THREE.LineLoop(ringGeo, ringMat);
    ringB.rotation.set(Math.PI * 0.66, -0.55, 0.4);
    ringB.scale.setScalar(1.12);
    tilt.add(ringA, ringB);

    /* ------------------------------------------------------- agents */
    // Specialist agents ride the orbit rings, each tethered to the core by a
    // beam that carries a pulse outward, so the hero shows the orchestration
    // pattern rather than only a network. Labels are DOM, not textures, so
    // the text stays crisp at any size.
    const agentCoreGeo = new THREE.OctahedronGeometry(0.055, 0);
    const agentShellGeo = new THREE.IcosahedronGeometry(0.11, 0);
    const agentCoreMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
    const agentShellMat = new THREE.MeshBasicMaterial({
      wireframe: true,
      transparent: true,
      depthWrite: false,
    });
    const onRing = { a: 0, b: 0 };
    const agents = AGENTS.map((name, i) => {
      const inner = i % 2 === 0;
      const ring = inner ? ringA : ringB;
      const slot = inner ? onRing.a++ : onRing.b++;
      const angle = inner ? (slot / 3) * Math.PI * 2 : Math.PI / 2 + slot * Math.PI;
      const holder = new THREE.Group();
      holder.position.set(Math.cos(angle) * 1.38, Math.sin(angle) * 1.38, 0);
      const shell = new THREE.Mesh(agentShellGeo, agentShellMat);
      holder.add(new THREE.Mesh(agentCoreGeo, agentCoreMat), shell);
      ring.add(holder);

      const label = document.createElement("div");
      label.className = "hero-agent-label";
      const dot = document.createElement("span");
      dot.className = "hero-agent-dot";
      label.append(dot, name);
      container.appendChild(label);

      return { holder, shell, label, phase: i * 0.37, last: 0, width: 0 };
    });

    // Beams and their pulses live in the tilt group, alongside the rings.
    const beamPositions = new Float32Array(AGENTS.length * 6);
    const beamGeo = new THREE.BufferGeometry();
    const beamAttr = new THREE.BufferAttribute(beamPositions, 3);
    beamAttr.setUsage(THREE.DynamicDrawUsage);
    beamGeo.setAttribute("position", beamAttr);
    const beamMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
    tilt.add(new THREE.LineSegments(beamGeo, beamMat));

    // Two point sets: a soft halo on each agent, and the pulse on each beam.
    const makePoints = (size: number, opacity: number) => {
      const positions = new Float32Array(AGENTS.length * 3);
      const geo = new THREE.BufferGeometry();
      const attr = new THREE.BufferAttribute(positions, 3);
      attr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute("position", attr);
      geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(AGENTS.length).fill(size), 1));
      geo.setAttribute("aGlow", new THREE.BufferAttribute(new Float32Array(AGENTS.length), 1));
      const mat = pointMaterial(36, opacity);
      const points = new THREE.Points(geo, mat);
      tilt.add(points);
      return { positions, geo, attr, mat, points };
    };
    const halo = makePoints(9, 0.55);
    const pulse = makePoints(2.4, 1);
    pulse.points.visible = !reducedMotion;

    const agentPos = new THREE.Vector3();
    const centre = new THREE.Vector3();
    const screen = new THREE.Vector3();
    let agentTime = 0;

    beforeRender = () => {
      anchor.updateMatrixWorld(true);
      const width = container.clientWidth;
      const height = container.clientHeight;
      anchor.getWorldPosition(centre);
      const centreDepth = centre.distanceTo(camera.position);

      agents.forEach((agent, i) => {
        agent.holder.getWorldPosition(agentPos);

        // Label: projected to screen, dimmed while the agent is behind the core.
        const behind = agentPos.distanceTo(camera.position) > centreDepth;
        screen.copy(agentPos).project(camera);
        const x = ((screen.x + 1) / 2) * width;
        const y = ((1 - screen.y) / 2) * height;
        // Near the right edge the label flips to the agent's left.
        // Measured once, and again after a resize (see layout).
        if (!agent.width) agent.width = agent.label.offsetWidth;
        const labelWidth = agent.width;
        const lx = x + 14 + labelWidth > width - 8 ? x - 14 - labelWidth : x + 14;
        agent.label.style.transform = `translate3d(${lx.toFixed(1)}px, ${y.toFixed(1)}px, 0) translateY(-50%)`;
        agent.label.style.opacity = behind ? "0.35" : "1";

        // Everything else in tilt-local space.
        tilt.worldToLocal(agentPos);
        agentPos.toArray(halo.positions, i * 3);
        beamPositions.set([0, 0, 0], i * 6);
        agentPos.toArray(beamPositions, i * 6 + 3);

        // A pulse leaves the core, and the agent's shell flares as it lands.
        const t = (agentTime * 0.45 + agent.phase) % 1;
        if (t < agent.last) agent.shell.scale.setScalar(1.7);
        agent.last = t;
        agentPos.multiplyScalar(t).toArray(pulse.positions, i * 3);
      });
      beamAttr.needsUpdate = true;
      halo.attr.needsUpdate = true;
      pulse.attr.needsUpdate = true;
    };

    // Ambient dust filling the whole hero, on its own slower parallax.
    const dustRand = mulberry32(99);
    const dustPositions = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dustPositions.set(
        [(dustRand() * 2 - 1) * 7, (dustRand() * 2 - 1) * 3.2, (dustRand() * 2 - 1) * 2.2],
        i * 3,
      );
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute(
      "aSize",
      new THREE.BufferAttribute(Float32Array.from({ length: DUST }, () => 0.6 + dustRand() * 1.1), 1),
    );
    dustGeo.setAttribute("aGlow", new THREE.BufferAttribute(new Float32Array(DUST), 1));
    const dustMat = pointMaterial(32, 0.5);
    dustMat.uniforms.uFogNear!.value = CAMERA_Z - 2.5;
    dustMat.uniforms.uFogFar!.value = CAMERA_Z + 2.5;
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    const pointMats = [nodeMat, signalMat, dustMat, halo.mat, pulse.mat];
    pointMats.forEach((m) => (m.uniforms.uPixelRatio!.value = pixelRatio));

    /* ---------------------------------------------------------- theme */
    const applyTheme = () => {
      const css = getComputedStyle(document.documentElement);
      const read = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
      const dark = document.documentElement.classList.contains("dark");
      const accent = new THREE.Color(read("--accent", "#7c8cff"));
      const accent2 = new THREE.Color(read("--accent-2", "#22d3ee"));
      const bg = new THREE.Color(read("--bg", dark ? "#07080c" : "#ffffff"));

      // Additive light on a dark page; normal blending on a light one, where
      // additive would wash out to white.
      const blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      (scene.fog as THREE.Fog).color.copy(bg);

      nodeMat.uniforms.uColor!.value.copy(accent);
      nodeMat.uniforms.uGlowColor!.value.copy(accent2);
      signalMat.uniforms.uColor!.value.copy(accent2);
      signalMat.uniforms.uGlowColor!.value.copy(accent2);
      dustMat.uniforms.uColor!.value.copy(accent);
      dustMat.uniforms.uGlowColor!.value.copy(accent);
      dustMat.uniforms.uOpacity!.value = dark ? 0.45 : 0.35;

      agentCoreMat.color.copy(accent2);
      agentShellMat.color.copy(accent);
      beamMat.color.copy(accent2);
      beamMat.opacity = dark ? 0.22 : 0.32;
      for (const m of [halo.mat, pulse.mat]) {
        m.uniforms.uColor!.value.copy(accent2);
        m.uniforms.uGlowColor!.value.copy(accent2);
      }

      linkMat.color.copy(accent);
      linkMat.opacity = dark ? 0.3 : 0.28;
      ringMat.color.copy(accent);
      ringMat.opacity = dark ? 0.16 : 0.18;

      for (const m of [nodeMat, signalMat, dustMat, linkMat, ringMat, beamMat, halo.mat, pulse.mat, agentCoreMat]) {
        m.blending = blending;
        m.needsUpdate = true;
      }
      if (reducedMotion) render();
    };
    applyTheme();
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    /* --------------------------------------------------------- layout */
    // Sit the network over the portrait so it reads as a halo of the person
    // rather than a decoration that happens to be nearby.
    const portrait = container.closest("section")?.querySelector<HTMLElement>("[data-hero-anchor]");

    const layout = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = `${width}px`;
      renderer.domElement.style.height = `${height}px`;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      for (const agent of agents) agent.width = 0;

      const visibleH = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      const worldPerPx = visibleH / height;

      let cx = width * 0.75;
      let cy = height * 0.45;
      let radiusPx = Math.min(width, height) * 0.32;
      if (portrait) {
        const box = container.getBoundingClientRect();
        const r = portrait.getBoundingClientRect();
        cx = r.left + r.width / 2 - box.left;
        cy = r.top + r.height / 2 - box.top;
        radiusPx = r.width * (width < 640 ? 0.8 : 0.72);
      }
      anchor.position.set((cx - width / 2) * worldPerPx, -(cy - height / 2) * worldPerPx, 0);
      anchor.scale.setScalar(radiusPx * worldPerPx);
      if (reducedMotion) render();
    };

    /* ---------------------------------------------------- interaction */
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (!reducedMotion) window.addEventListener("pointermove", onPointerMove, { passive: true });

    /* ----------------------------------------------------------- loop */
    const tmpA = new THREE.Vector3();
    const tmpB = new THREE.Vector3();
    const clock = new THREE.Clock();
    let raf = 0;
    let running = false;

    const step = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const scroll = Math.min(window.scrollY / Math.max(container.offsetHeight, 1), 1);

      spin.rotation.y += dt * 0.09;
      spin.rotation.x = Math.sin(clock.elapsedTime * 0.12) * 0.12;
      tilt.rotation.x += (pointer.y * 0.35 + scroll * 0.9 - tilt.rotation.x) * 0.05;
      tilt.rotation.y += (pointer.x * 0.5 + scroll * 0.6 - tilt.rotation.y) * 0.05;
      ringA.rotation.z += dt * 0.11;
      ringB.rotation.z -= dt * 0.08;
      agentTime += dt;
      for (const agent of agents) {
        agent.shell.rotation.x += dt * 0.8;
        agent.shell.rotation.y += dt * 1.1;
        const s = agent.shell.scale.x;
        agent.shell.scale.setScalar(s + (1 - s) * 0.08);
      }
      dust.rotation.y = pointer.x * 0.06 + clock.elapsedTime * 0.01;
      dust.rotation.x = pointer.y * 0.04;

      for (let i = 0; i < nodeCount; i++) glow[i]! *= 0.94;

      signals.forEach((s, k) => {
        s.t += dt * s.speed;
        if (s.t >= 1) {
          glow[s.to] = 1;
          const options = net.adjacency[s.to]!;
          const next = options[Math.floor(rand() * options.length)] ?? s.from;
          s.from = s.to;
          s.to = next;
          s.t = 0;
        }
        tmpA.fromArray(net.positions, s.from * 3);
        tmpB.fromArray(net.positions, s.to * 3);
        tmpA.lerp(tmpB, s.t).toArray(signalPositions, k * 3);
      });
      signalAttr.needsUpdate = true;
      glowAttr.needsUpdate = true;

      render();
      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (running || reducedMotion) return;
      running = true;
      clock.getDelta();
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(container);
    if (portrait) resizeObserver.observe(portrait);
    layout();
    // The portrait animates in, so measure again once it has settled.
    const settle = window.setTimeout(layout, 800);

    const visibility = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) start();
      else stop();
    });
    visibility.observe(container);

    render();
    container.style.opacity = "1";

    return () => {
      stop();
      window.clearTimeout(settle);
      visibility.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      for (const g of [nodeGeo, linkGeo, signalGeo, ringGeo, dustGeo, beamGeo, halo.geo, pulse.geo, agentCoreGeo, agentShellGeo]) {
        g.dispose();
      }
      for (const m of [nodeMat, signalMat, dustMat, linkMat, ringMat, beamMat, halo.mat, pulse.mat, agentCoreMat, agentShellMat]) {
        m.dispose();
      }
      for (const agent of agents) agent.label.remove();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onError]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-[1200ms] ease-out"
    />
  );
}
