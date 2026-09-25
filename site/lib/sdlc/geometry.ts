/**
 * Ring geometry for the lifecycle diagram. Everything is in a 100x100 viewBox, so a
 * percentage position on the container matches a coordinate in the SVG and the HTML
 * stage buttons can be placed with `left`/`top` percentages.
 */

export const CENTER = 50;
/** Radius of the ring the stage nodes sit on. */
export const RING_RADIUS = 33;
/** The travelling work-item marker orbits just inside the nodes. */
export const PIN_RADIUS = 25;
/** Inner radius of the "review failed, back to build" loop. */
export const LOOP_RADIUS = 18.5;
/** Degrees trimmed from each end of a connector so it stops at the node's edge. */
export const NODE_TRIM_DEG = 12;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Stage angles run clockwise from 12 o'clock. */
export function stageAngle(index: number, count: number): number {
  return -90 + (360 / count) * index;
}

/**
 * Rounds to three decimals (0.001 of a 100-unit viewBox, far below a pixel). Every number
 * this file hands to the markup goes through it, and that is a correctness rule, not
 * tidiness: these components render on the server and again in the browser, and
 * `Math.sin`/`Math.cos` are not guaranteed to agree to the last bit between Node and a
 * given browser. A raw `21.42116167511353` on one side and `21.421161675113535` on the
 * other is a React hydration mismatch on the SVG `transform` attribute (DECISIONS.md D-053).
 * Rounding first makes both sides print the same string.
 */
const fmt = (n: number) => Number(n.toFixed(3));

export function polar(
  angleDeg: number,
  radius: number = RING_RADIUS,
): { x: number; y: number } {
  return {
    x: fmt(CENTER + radius * Math.cos(rad(angleDeg))),
    y: fmt(CENTER + radius * Math.sin(rad(angleDeg))),
  };
}

/** SVG arc from one angle to another around the centre; `clockwise` picks the sweep. */
export function arcPath(
  fromDeg: number,
  toDeg: number,
  radius: number,
  clockwise = true,
): string {
  const a = polar(fromDeg, radius);
  const b = polar(toDeg, radius);
  const span = clockwise
    ? (((toDeg - fromDeg) % 360) + 360) % 360
    : (((fromDeg - toDeg) % 360) + 360) % 360;
  const large = span > 180 ? 1 : 0;
  return `M ${fmt(a.x)} ${fmt(a.y)} A ${radius} ${radius} 0 ${large} ${clockwise ? 1 : 0} ${fmt(b.x)} ${fmt(b.y)}`;
}

/** The connector from stage `index` to the next one, trimmed to clear both nodes. */
export function connectorPath(index: number, count: number): string {
  const from = stageAngle(index, count) + NODE_TRIM_DEG;
  const to = stageAngle(index + 1, count) - NODE_TRIM_DEG;
  return arcPath(from, to, RING_RADIUS, true);
}

/** Midpoint of a connector plus the tangent direction there, for the direction chevron. */
export function connectorChevron(
  index: number,
  count: number,
): { x: number; y: number; rotation: number } {
  const mid = (stageAngle(index, count) + stageAngle(index + 1, count)) / 2;
  const { x, y } = polar(mid);
  // The tangent of a clockwise circle at angle θ points along θ + 90°.
  return { x, y, rotation: mid + 90 };
}

/**
 * How far the travelling marker should turn to go from stage `from` to stage `to`.
 * Forward (clockwise) is preferred, because the walkthrough advances that way and a
 * wrap from the last stage to the first should keep gliding on rather than swing back.
 * A jump backwards of more than a half turn takes the short way round.
 */
export function rotationDelta(from: number, to: number, count: number): number {
  const step = 360 / count;
  let d = to - from;
  if (d > count / 2) d -= count;
  if (d < -count / 2) d += count;
  // Exactly half a turn: go forward.
  if (Math.abs(d) === count / 2) d = count / 2;
  return d * step;
}
