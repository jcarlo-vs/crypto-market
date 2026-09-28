/** Pure geometry for the price line. No DOM, no React — so it can be tested. */

export type Point = { t: number; c: number };

export type Geom = {
  /** SVG path for the line. */
  line: string;
  /** SVG path for the fill beneath it. */
  area: string;
  /** Screen position of each input point, for the hover crosshair. */
  coords: { x: number; y: number; t: number; c: number }[];
  low: number;
  high: number;
  /** y of the low and high gridlines, for direct labels. */
  lowY: number;
  highY: number;
  width: number;
  height: number;
};

const PAD_TOP = 14;
// Deeper than the top: the low-price label is drawn *below* its gridline and
// would otherwise be clipped by the viewBox edge.
const PAD_BOTTOM = 26;

/** Returns null for anything unplottable, so callers render a fallback
 *  instead of an SVG full of NaN. */
export function buildGeom(
  points: Point[],
  width: number,
  height: number,
): Geom | null {
  if (points.length < 2 || width <= 0 || height <= 0) return null;

  const closes = points.map((p) => p.c).filter(Number.isFinite);
  if (closes.length < 2) return null;

  const low = Math.min(...closes);
  const high = Math.max(...closes);
  const plotH = height - PAD_TOP - PAD_BOTTOM;

  // A perfectly flat series has no range to scale against: draw it mid-height.
  const span = high - low;
  const y = (v: number) =>
    span === 0 ? PAD_TOP + plotH / 2 : PAD_TOP + (1 - (v - low) / span) * plotH;
  const x = (i: number) => (i / (points.length - 1)) * width;

  const coords = points.map((p, i) => ({ x: x(i), y: y(p.c), t: p.t, c: p.c }));
  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;

  return {
    line,
    area,
    coords,
    low,
    high,
    lowY: y(low),
    highY: y(high),
    width,
    height,
  };
}
