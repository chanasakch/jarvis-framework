"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  buildShell,
  perspective,
  rotate,
  spoke,
  tiltedRing,
  voice,
} from "@/lib/viz/orb";

const STORAGE_KEY = "jarvis-orb-paused";
/** The time drawn when nothing is moving (first paint, Reduce Motion, paused before any motion). */
const REST_TIME = 4.1;

// Built once at module load: the shells turn rigidly, so their links never change.
const OUTER = buildShell(210, 0.36);
const INNER = buildShell(80, 0.62);
const RINGS = [
  { pts: tiltedRing(120, 1.18, 1.15, 0.2), speed: 0.18, dash: [3, 7] },
  { pts: tiltedRing(120, 1.34, 0.55, -0.5), speed: -0.12, dash: [] },
];
const SPOKES = 72;

type Frame = {
  ctx: CanvasRenderingContext2D;
  size: number;
  dpr: number;
  color: string;
};

/** Depth of a rotated unit point as 0 (farthest) .. 1 (nearest). */
const nearness = (z: number) => (1 - z) / 2;

function drawShell(
  f: Frame,
  shell: { points: Float32Array; edges: Uint16Array },
  scale: number,
  yaw: number,
  pitch: number,
  half: "back" | "front",
  strength: number,
) {
  const { ctx, size, dpr } = f;
  const c = size / 2;
  const n = shell.points.length / 3;
  const sx = new Float32Array(n);
  const sy = new Float32Array(n);
  const near = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const [x, y, z] = rotate(
      shell.points[i * 3]!,
      shell.points[i * 3 + 1]!,
      shell.points[i * 3 + 2]!,
      yaw,
      pitch,
    );
    const p = perspective(z);
    sx[i] = c + x * scale * p;
    sy[i] = c + y * scale * p;
    near[i] = nearness(z);
  }

  // Links, batched into four depth bands so the whole shell costs four strokes, not hundreds.
  const bands: number[][] = [[], [], [], []];
  for (let e = 0; e < shell.edges.length; e += 2) {
    const a = shell.edges[e]!;
    const b = shell.edges[e + 1]!;
    const d = (near[a]! + near[b]!) / 2;
    if (d >= 0.5 !== (half === "front")) continue;
    bands[Math.min(3, Math.floor(d * 4))]!.push(a, b);
  }
  ctx.lineWidth = dpr;
  bands.forEach((band, k) => {
    if (!band.length) return;
    ctx.globalAlpha = (0.06 + 0.2 * (k / 3)) * strength;
    ctx.beginPath();
    for (let i = 0; i < band.length; i += 2) {
      ctx.moveTo(sx[band[i]!]!, sy[band[i]!]!);
      ctx.lineTo(sx[band[i + 1]!]!, sy[band[i + 1]!]!);
    }
    ctx.stroke();
  });

  // Nodes, bigger and brighter as they come toward the viewer.
  for (let k = 0; k < 3; k++) {
    ctx.globalAlpha = (0.25 + 0.35 * k) * strength;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const d = near[i]!;
      if (
        d >= 0.5 !== (half === "front") ||
        Math.min(2, Math.floor(d * 3)) !== k
      )
        continue;
      const r = (0.8 + 1.7 * d) * dpr;
      ctx.moveTo(sx[i]! + r, sy[i]!);
      ctx.arc(sx[i]!, sy[i]!, r, 0, Math.PI * 2);
    }
    ctx.fill();
  }
}

function drawRing(
  f: Frame,
  ring: (typeof RINGS)[number],
  scale: number,
  t: number,
  half: "back" | "front",
) {
  const { ctx, size, dpr } = f;
  const c = size / 2;
  const yaw = t * ring.speed;
  ctx.setLineDash(ring.dash.map((d) => d * dpr));
  ctx.lineWidth = dpr;
  ctx.globalAlpha = half === "front" ? 0.45 : 0.2;
  ctx.beginPath();
  let pen = false;
  for (let i = 0; i < ring.pts.length; i += 3) {
    const [x, y, z] = rotate(
      ring.pts[i]!,
      ring.pts[i + 1]!,
      ring.pts[i + 2]!,
      yaw,
      0.35,
    );
    const isFront = z < 0;
    if (isFront !== (half === "front")) {
      pen = false;
      continue;
    }
    const p = perspective(z);
    const px = c + x * scale * p;
    const py = c + y * scale * p;
    if (pen) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
    pen = true;
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCore(f: Frame, R: number, t: number) {
  const { ctx, size, dpr } = f;
  const c = size / 2;
  const level = voice(t);
  const r0 = R * (0.14 + 0.13 * level);

  // Halo: stacked flat discs, so it reads as a glow without a gradient.
  ctx.globalAlpha = 0.045;
  for (let k = 4; k >= 1; k--) {
    ctx.beginPath();
    ctx.arc(c, c, r0 * (1 + k * (0.5 + 0.6 * level)), 0, Math.PI * 2);
    ctx.fill();
  }

  // Ripples leaving the core.
  ctx.lineWidth = dpr;
  for (let k = 0; k < 3; k++) {
    const p = (t / 2.8 + k / 3) % 1;
    ctx.globalAlpha = (1 - p) * (0.14 + 0.3 * level);
    ctx.beginPath();
    ctx.arc(c, c, R * (0.24 + 0.9 * p), 0, Math.PI * 2);
    ctx.stroke();
  }

  // Spectrum ring: one spoke per slice, each following the voice a little differently.
  ctx.lineWidth = 1.4 * dpr;
  ctx.globalAlpha = 0.5 + 0.4 * level;
  ctx.beginPath();
  const tips: number[] = [];
  for (let i = 0; i < SPOKES; i++) {
    const a = (i / SPOKES) * Math.PI * 2 + t * 0.12;
    const len = R * 0.6 * spoke(i, SPOKES, t, level);
    const x0 = c + Math.cos(a) * r0 * 1.15;
    const y0 = c + Math.sin(a) * r0 * 1.15;
    const x1 = c + Math.cos(a) * (r0 * 1.15 + len);
    const y1 = c + Math.sin(a) * (r0 * 1.15 + len);
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    tips.push(x1, y1);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < tips.length; i += 2) {
    ctx.moveTo(tips[i]! + 1.4 * dpr, tips[i + 1]!);
    ctx.arc(tips[i]!, tips[i + 1]!, 1.4 * dpr, 0, Math.PI * 2);
  }
  ctx.fill();

  // Solid centre.
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(c, c, r0, 0, Math.PI * 2);
  ctx.fill();
}

function draw(f: Frame, t: number) {
  const { ctx, size } = f;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = f.color;
  ctx.fillStyle = f.color;

  const R = size * 0.29 * (1 + 0.025 * voice(t));
  const yaw = t * 0.24;
  const pitch = 0.4 + 0.12 * Math.sin(t * 0.31);

  for (const ring of RINGS) drawRing(f, ring, R, t, "back");
  drawShell(f, OUTER, R, yaw, pitch, "back", 1);
  drawShell(f, INNER, R * 0.55, -yaw * 1.6, pitch * 0.6, "back", 0.8);
  drawCore(f, R, t);
  drawShell(f, INNER, R * 0.55, -yaw * 1.6, pitch * 0.6, "front", 0.8);
  drawShell(f, OUTER, R, yaw, pitch, "front", 1);
  for (const ring of RINGS) drawRing(f, ring, R, t, "front");
  f.ctx.globalAlpha = 1;
}

/**
 * The 3D orb on the landing page: a rotating network with a core that swells and settles like a
 * voice being picked up. It is decoration (`aria-hidden`), it does not listen to anything, and the
 * "voice" is invented motion (lib/viz/orb.ts).
 *
 * Motion that never ends on its own has to be stoppable (WCAG 2.2.2), hence the pause button. It
 * runs only while all of these hold: not paused by the reader, on screen, tab visible, and the
 * reader has not asked for reduced motion (then a single still frame is drawn and the button is
 * hidden). Colour comes from the brand token via `text-brand`, re-read when the theme changes.
 */
export function JarvisOrb({
  pauseLabel,
  playLabel,
}: {
  pauseLabel: string;
  playLabel: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ref, inView } = useInView<HTMLDivElement>(0);
  const reduced = useReducedMotion();
  // null until the saved choice is read, so the first client render equals the server's.
  const [paused, setPaused] = useState<boolean | null>(null);
  const [tabVisible, setTabVisible] = useState(true);
  const frame = useRef<Frame | null>(null);
  const clock = useRef(REST_TIME);

  const running = paused === false && inView && tabVisible && !reduced;

  const paint = useCallback(() => {
    if (frame.current) draw(frame.current, clock.current);
  }, []);

  // Size the backing store to the box and the device, and keep it that way.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const css = canvas.clientWidth;
      canvas.width = Math.round(css * dpr);
      canvas.height = Math.round(css * dpr);
      frame.current = {
        ctx,
        size: canvas.width,
        dpr,
        color: getComputedStyle(canvas).color,
      };
      paint();
    };
    // The brand colour changes with the theme; next-themes flips a class on <html>.
    const recolor = () => {
      if (!frame.current) return;
      frame.current.color = getComputedStyle(canvas).color;
      paint();
    };
    setup();
    const resize = new ResizeObserver(setup);
    resize.observe(canvas);
    const theme = new MutationObserver(recolor);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", recolor);
    return () => {
      resize.disconnect();
      theme.disconnect();
      media.removeEventListener("change", recolor);
    };
  }, [paint]);

  useEffect(() => {
    let saved = false;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Storage can be blocked; the default is "playing".
    }
    // Same justified case as hooks/use-reduced-motion.ts: reading client-only state on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPaused(saved);
  }, []);

  useEffect(() => {
    const onChange = () =>
      setTabVisible(document.visibilityState === "visible");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  useEffect(() => {
    if (!running) return;
    let id = 0;
    let last = performance.now();
    const tick = (now: number) => {
      clock.current += Math.min(0.05, (now - last) / 1000);
      last = now;
      paint();
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [running, paint]);

  const toggle = () => {
    const next = !paused;
    setPaused(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Not persisted; the choice still holds for this visit.
    }
  };

  return (
    <div
      ref={ref}
      data-testid="jarvis-orb"
      data-orb-running={running}
      className="relative mx-auto aspect-square w-full max-w-lg"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="size-full text-brand"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={paused ? playLabel : pauseLabel}
        data-testid="jarvis-orb-toggle"
        className="absolute right-0 bottom-0 size-8 text-muted-foreground motion-reduce:hidden"
      >
        {paused ? <PlayIcon /> : <PauseIcon />}
      </Button>
    </div>
  );
}
