/**
 * The "cost of fixing a problem, by when you find it" chart. The values are illustrative:
 * the shape (a problem found later costs more to put right) is the widely repeated
 * software-engineering finding, but the numbers here are not measured, they carry no unit,
 * and the page says so. What matters is the ordering, so the axis has no scale.
 *
 * Everything this file returns goes into SVG attributes on a page that renders on the
 * server and again in the browser, so every number is rounded (DECISIONS.md D-053). The
 * arithmetic itself (+ - * /) is exact and identical everywhere; the rounding is a belt to
 * that pair of braces.
 */
import { COST_POINT_IDS, type CostPointId } from "./model";

export const CHART = { width: 640, height: 264, left: 40, right: 40, top: 24, bottom: 48 } as const;

/** Relative cost of a fix, per point. Only the order and rough steepness are meant. */
export const COST_VALUES: Record<CostPointId, number> = {
  discover: 1,
  define: 1.5,
  design: 2.3,
  build: 3.6,
  verify: 5.4,
  ship: 8,
  live: 13,
};

const r1 = (n: number) => Math.round(n * 10) / 10;

export interface ChartPoint {
  id: CostPointId;
  x: number;
  y: number;
}

export function chartPoints(): ChartPoint[] {
  const { width, height, left, right, top, bottom } = CHART;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const max = Math.max(...Object.values(COST_VALUES));
  const min = Math.min(...Object.values(COST_VALUES));
  return COST_POINT_IDS.map((id, i) => ({
    id,
    x: r1(left + (innerW * i) / (COST_POINT_IDS.length - 1)),
    y: r1(top + innerH - ((COST_VALUES[id] - min) / (max - min)) * innerH),
  }));
}

/** A smooth curve through the points (Catmull-Rom converted to cubic Beziers). */
export function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const p = (i: number) => points[Math.min(Math.max(i, 0), points.length - 1)]!;
  let d = `M ${r1(p(0).x)} ${r1(p(0).y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${r1(p2.x)} ${r1(p2.y)}`;
  }
  return d;
}

/** The same curve closed down to the baseline, for the soft fill under it. */
export function areaPath(points: { x: number; y: number }[]): string {
  const baseline = CHART.height - CHART.bottom;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${smoothPath(points)} L ${r1(last.x)} ${baseline} L ${r1(first.x)} ${baseline} Z`;
}
