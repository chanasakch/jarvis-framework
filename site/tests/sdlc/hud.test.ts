import { afterEach, describe, expect, it, vi } from "vitest";

import {
  HUD_H,
  HUD_W,
  hudArc,
  hudBrackets,
  hudPoint,
  hudRuler,
  hudTicks,
  hudWedge,
} from "@/lib/viz/hud";

const snapshot = () =>
  JSON.stringify([
    hudPoint(37, 230),
    hudArc(-20, 60, 290),
    hudWedge(-38, 0, 290),
    hudTicks(72, 250, 6, 12, 6),
    hudBrackets(40, 30, HUD_W - 80, HUD_H - 60, 30),
    hudRuler(64, 190, 21, 11, 1),
  ]);

describe("hero HUD geometry", () => {
  afterEach(() => vi.restoreAllMocks());

  it("puts 3 o'clock to the right of centre and 6 o'clock below it", () => {
    expect(hudPoint(0, 100)).toEqual({ x: HUD_W / 2 + 100, y: HUD_H / 2 });
    expect(hudPoint(90, 100)).toEqual({ x: HUD_W / 2, y: HUD_H / 2 + 100 });
  });

  it("draws one tick per step, every longEvery-th one longer", () => {
    const { short, long } = hudTicks(72, 250, 6, 12, 6);
    expect(long.split("M").length - 1).toBe(12);
    expect(short.split("M").length - 1).toBe(60);
  });

  // Same rule as D-053: the server and the browser must print identical attributes even when
  // Math.sin and Math.cos differ in their last bits.
  it("renders the same values when sin and cos differ in their last bits", () => {
    const exact = snapshot();
    const sin = Math.sin;
    const cos = Math.cos;
    vi.spyOn(Math, "sin").mockImplementation((x) => sin(x) * (1 + 4e-16));
    vi.spyOn(Math, "cos").mockImplementation((x) => cos(x) * (1 - 4e-16));
    expect(snapshot()).toBe(exact);
  });

  it("emits no coordinate with more than two decimals", () => {
    for (const n of snapshot().match(/-?\d+\.\d+/g) ?? []) {
      expect(n.split(".")[1]!.length).toBeLessThanOrEqual(2);
    }
  });
});
