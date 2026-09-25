import { describe, expect, it } from "vitest";

import {
  buildShell,
  fibonacciSphere,
  perspective,
  rotate,
  spoke,
  tiltedRing,
  voice,
} from "@/lib/viz/orb";

describe("orb geometry", () => {
  it("puts every sphere point on the unit sphere", () => {
    const p = fibonacciSphere(120);
    for (let i = 0; i < 120; i++) {
      expect(Math.hypot(p[i * 3]!, p[i * 3 + 1]!, p[i * 3 + 2]!)).toBeCloseTo(
        1,
        5,
      );
    }
  });

  it("links neighbours only: every point has at least one link and none is joined to itself", () => {
    const { edges } = buildShell(210, 0.36);
    const degree = new Map<number, number>();
    for (let e = 0; e < edges.length; e += 2) {
      expect(edges[e]).not.toBe(edges[e + 1]);
      degree.set(edges[e]!, (degree.get(edges[e]!) ?? 0) + 1);
      degree.set(edges[e + 1]!, (degree.get(edges[e + 1]!) ?? 0) + 1);
    }
    expect(degree.size).toBe(210);
    expect(edges.length / 2).toBeLessThan(1500);
  });

  it("rotation keeps a point at the same distance from the centre", () => {
    const [x, y, z] = rotate(0.3, 0.5, 0.8, 1.1, 0.6);
    expect(Math.hypot(x, y, z)).toBeCloseTo(Math.hypot(0.3, 0.5, 0.8), 6);
  });

  it("makes nearer points larger", () => {
    expect(perspective(-1)).toBeGreaterThan(perspective(0));
    expect(perspective(0)).toBeGreaterThan(perspective(1));
  });

  it("keeps a tilted ring at its radius", () => {
    const r = tiltedRing(24, 1.3, 1.1, 0.2);
    for (let i = 0; i < r.length; i += 3)
      expect(Math.hypot(r[i]!, r[i + 1]!, r[i + 2]!)).toBeCloseTo(1.3, 5);
  });
});

describe("orb motion", () => {
  it("stays within 0..1 and both swells and settles over a minute", () => {
    let min = 1;
    let max = 0;
    for (let t = 0; t < 60; t += 0.05) {
      const v = voice(t);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    expect(max - min).toBeGreaterThan(0.5);
  });

  it("keeps every spoke within 0..1", () => {
    for (let t = 0; t < 20; t += 0.7) {
      for (let i = 0; i < 72; i++) {
        const s = spoke(i, 72, t, voice(t));
        expect(s).toBeGreaterThan(0);
        expect(s).toBeLessThanOrEqual(1);
      }
    }
  });
});
