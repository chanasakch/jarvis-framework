/**
 * Geometry and motion for the "Meet Jarvis" orb: a rotating 3D network with a core that swells and
 * settles like a voice being picked up. Pure functions and typed arrays, no DOM, so the shape is
 * deterministic and testable. The canvas component only draws what this returns.
 *
 * Nothing here is drawn from markup, so the hydration rule from D-053 does not apply; the canvas is
 * empty on the server and filled after mount.
 */

export type Vec3 = readonly [number, number, number];

export type Shell = {
  /** Unit-sphere points, flattened x,y,z. */
  points: Float32Array;
  /** Index pairs, flattened a,b. Fixed topology: the shell turns rigidly, so it is built once. */
  edges: Uint16Array;
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** `count` points spread evenly over a unit sphere (Fibonacci lattice). */
export function fibonacciSphere(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(1 - y * y);
    const a = GOLDEN_ANGLE * i;
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = Math.sin(a) * r;
  }
  return out;
}

/** Joins every pair of points closer than `maxChord`, which makes a geodesic-looking web. */
export function buildShell(count: number, maxChord: number): Shell {
  const points = fibonacciSphere(count);
  const pairs: number[] = [];
  const limit = maxChord * maxChord;
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const dx = points[i * 3]! - points[j * 3]!;
      const dy = points[i * 3 + 1]! - points[j * 3 + 1]!;
      const dz = points[i * 3 + 2]! - points[j * 3 + 2]!;
      if (dx * dx + dy * dy + dz * dz < limit) pairs.push(i, j);
    }
  }
  return { points, edges: Uint16Array.from(pairs) };
}

/** Rotate about Y by `yaw`, then about X by `pitch`. */
export function rotate(
  x: number,
  y: number,
  z: number,
  yaw: number,
  pitch: number,
): Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
}

/** Perspective divide: how much a point at depth `z` is scaled (nearer is larger). */
export function perspective(z: number, distance = 4.5): number {
  return distance / (distance + z);
}

/**
 * How loudly the "voice" is speaking at time `t` seconds, 0..1. A slow envelope gates quicker
 * partials, so it swells in phrases with pauses between them instead of buzzing steadily. It is
 * invented motion, not a measurement of anything, and the page says nothing that implies otherwise.
 */
export function voice(t: number): number {
  const phrase = 0.5 + 0.5 * Math.sin(t * 0.55 - 1.2);
  const syllables =
    0.5 +
    0.5 *
      (0.55 * Math.sin(t * 3.1) +
        0.3 * Math.sin(t * 7.3 + 1.7) +
        0.15 * Math.sin(t * 13.7));
  const level = 0.16 + 0.84 * phrase * phrase * syllables;
  return Math.min(1, Math.max(0, level));
}

/** Length of spoke `i` of `n` in the core's ring at time `t`, 0..1, following `level`. */
export function spoke(i: number, n: number, t: number, level: number): number {
  const a = (i / n) * Math.PI * 2;
  const shape =
    0.5 + 0.5 * Math.sin(a * 3 + t * 1.9) * Math.cos(a * 5 - t * 1.3);
  const fine = 0.5 + 0.5 * Math.sin(i * 12.9898 + t * 6.1);
  return Math.min(1, 0.12 + level * (0.55 * shape + 0.45 * fine));
}

/** Points of a circle of radius `r` in 3D, tilted about X by `tilt` and about Z by `roll`. */
export function tiltedRing(
  segments: number,
  r: number,
  tilt: number,
  roll: number,
): Float32Array {
  const out = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    let x = Math.cos(a) * r;
    let y = 0;
    let z = Math.sin(a) * r;
    const y1 = y * Math.cos(tilt) - z * Math.sin(tilt);
    z = y * Math.sin(tilt) + z * Math.cos(tilt);
    y = y1;
    const x1 = x * Math.cos(roll) - y * Math.sin(roll);
    y = x * Math.sin(roll) + y * Math.cos(roll);
    x = x1;
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}
