/**
 * Geometry for the landing hero's HUD backdrop. Pure functions, no React, so the numbers can be
 * tested and so the server and the browser print identical markup.
 *
 * Every value that reaches an SVG attribute is rounded first. `Math.sin`/`Math.cos` are not
 * guaranteed to agree to the last bit between Node and a browser, and a one-digit difference in
 * an attribute is a React hydration mismatch (DECISIONS.md D-053).
 */

export const HUD_W = 1200;
export const HUD_H = 600;
export const HUD_CX = HUD_W / 2;
export const HUD_CY = HUD_H / 2;

const fmt = (n: number) => Number(n.toFixed(2));
const rad = (deg: number) => (deg * Math.PI) / 180;

/** A point on a circle around the HUD centre; 0 degrees is 3 o'clock, angles run clockwise. */
export function hudPoint(
  angleDeg: number,
  radius: number,
): { x: number; y: number } {
  return {
    x: fmt(HUD_CX + radius * Math.cos(rad(angleDeg))),
    y: fmt(HUD_CY + radius * Math.sin(rad(angleDeg))),
  };
}

/** A clockwise arc of a circle around the centre, as an SVG path. Spans of 180 degrees or less. */
export function hudArc(fromDeg: number, toDeg: number, radius: number): string {
  const a = hudPoint(fromDeg, radius);
  const b = hudPoint(toDeg, radius);
  const large = (((toDeg - fromDeg) % 360) + 360) % 360 > 180 ? 1 : 0;
  return `M${a.x} ${a.y}A${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y}`;
}

/** A filled pie slice from the centre out to `radius`, used for the trailing edge of the sweep. */
export function hudWedge(
  fromDeg: number,
  toDeg: number,
  radius: number,
): string {
  const a = hudPoint(fromDeg, radius);
  const b = hudPoint(toDeg, radius);
  const large = (((toDeg - fromDeg) % 360) + 360) % 360 > 180 ? 1 : 0;
  return `M${HUD_CX} ${HUD_CY}L${a.x} ${a.y}A${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y}Z`;
}

export type HudTick = { d: string; long: boolean };

/** Evenly spaced radial tick marks on a ring; every `longEvery`th is longer. One path per tick weight. */
export function hudTicks(
  count: number,
  radius: number,
  short: number,
  long: number,
  longEvery: number,
): { short: string; long: string } {
  const shortParts: string[] = [];
  const longParts: string[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (360 / count) * i;
    const isLong = i % longEvery === 0;
    const a = hudPoint(angle, radius);
    const b = hudPoint(angle, radius + (isLong ? long : short));
    (isLong ? longParts : shortParts).push(`M${a.x} ${a.y}L${b.x} ${b.y}`);
  }
  return { short: shortParts.join(""), long: longParts.join("") };
}

/** Corner brackets `[ ]` for a rectangle, as one path. `arm` is the length of each bracket arm. */
export function hudBrackets(
  x: number,
  y: number,
  w: number,
  h: number,
  arm: number,
): string {
  const r = x + w;
  const b = y + h;
  return [
    `M${x} ${y + arm}V${y}H${x + arm}`,
    `M${r - arm} ${y}H${r}V${y + arm}`,
    `M${r} ${b - arm}V${b}H${r - arm}`,
    `M${x + arm} ${b}H${x}V${b - arm}`,
  ].join("");
}

/** Short vertical scale marks (a ruler) starting at (x, y), stepping down by `step`. */
export function hudRuler(
  x: number,
  y: number,
  count: number,
  step: number,
  dir: 1 | -1,
): string {
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const len = i % 5 === 0 ? 14 : 7;
    parts.push(`M${x} ${y + i * step}h${dir * len}`);
  }
  return parts.join("");
}
