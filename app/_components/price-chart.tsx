"use client";

import { useState } from "react";
import { buildGeom, type Point } from "@/lib/chart";
import { formatPrice } from "@/lib/format";

/** Single-series price line with a hover crosshair.
 *  One series, so no legend — the panel heading names it. The low and high are
 *  labelled directly instead of drawing a y-axis nobody reads. */

const W = 1000;
const H = 260;
/** Past this fraction of the width, the tooltip flips to the left of the cursor
 *  so it cannot run off the edge. */
const FLIP_AT = 0.72;

export default function PriceChart({
  points,
  label,
}: {
  points: Point[];
  label: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const geom = buildGeom(points, W, H);

  if (!geom) return <p className="nochart">Not enough price history to chart.</p>;

  const first = geom.coords[0];
  const last = geom.coords[geom.coords.length - 1];
  const colour = last.c >= first.c ? "var(--green)" : "var(--red)";
  const cursor = hover == null ? null : geom.coords[hover];
  const flip = cursor != null && cursor.x > W * FLIP_AT;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width === 0) return;
    const last = geom!.coords.length - 1;
    const i = Math.round(((e.clientX - box.left) / box.width) * last);
    setHover(Math.min(last, Math.max(0, i)));
  }

  return (
    <svg
      className="ch"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${label}: price from ${formatPrice(first.c)} to ${formatPrice(
        last.c,
      )}, low ${formatPrice(geom.low)}, high ${formatPrice(geom.high)}.`}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id="price-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: colour, stopOpacity: 0.22 }} />
          <stop offset="100%" style={{ stopColor: colour, stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {/* recessive gridlines, at the two values worth marking */}
      <line className="ch-grid" x1="0" y1={geom.highY} x2={W} y2={geom.highY} />
      <line className="ch-grid" x1="0" y1={geom.lowY} x2={W} y2={geom.lowY} />

      <path d={geom.area} fill="url(#price-fade)" />
      <path className="ch-line" d={geom.line} style={{ stroke: colour }} />

      {/* direct labels beat an axis; they stay in ink, not the series colour */}
      <text className="ch-lbl" x="8" y={geom.highY - 6}>
        {formatPrice(geom.high)}
      </text>
      <text className="ch-lbl" x="8" y={geom.lowY + 16}>
        {formatPrice(geom.low)}
      </text>

      <circle cx={last.x} cy={last.y} r="4" style={{ fill: colour }} />

      {cursor && (
        <g>
          <line className="ch-grid" x1={cursor.x} y1="0" x2={cursor.x} y2={H} />
          <circle
            className="ch-cursor"
            cx={cursor.x}
            cy={cursor.y}
            r="4.5"
            style={{ fill: colour }}
          />
          <text
            className="ch-val"
            x={flip ? cursor.x - 10 : cursor.x + 10}
            y={Math.max(18, cursor.y - 14)}
            textAnchor={flip ? "end" : "start"}
          >
            {formatPrice(cursor.c)}
          </text>
          <text
            className="ch-time"
            x={flip ? cursor.x - 10 : cursor.x + 10}
            y={Math.max(34, cursor.y + 4)}
            textAnchor={flip ? "end" : "start"}
          >
            {new Date(cursor.t).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </text>
        </g>
      )}
    </svg>
  );
}
