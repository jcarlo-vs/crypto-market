import type { Point } from "./chart";

/** Candles for the price chart.
 *
 *  Deliberately NOT CoinMarketCap: chart views would burn the 15k monthly
 *  credit budget fast. Binance's public endpoint needs no key, costs nothing,
 *  and has far higher limits — so charts never touch the CMC budget.
 *
 *  ponytail: api.binance.com answers 451 from some regions (including parts of
 *  the US, which matters if you deploy to Vercel). If that happens, swap the URL
 *  in this one function for Kraken's /0/public/OHLC — no other file knows where
 *  candles come from.
 */

export const RANGES = {
  "24h": { interval: "15m", limit: 96, label: "24H" },
  "7d": { interval: "1h", limit: 168, label: "7D" },
  "30d": { interval: "4h", limit: 180, label: "30D" },
  "1y": { interval: "1d", limit: 365, label: "1Y" },
} as const;

export type Range = keyof typeof RANGES;

export const DEFAULT_RANGE: Range = "7d";

export function isRange(v: string | undefined): v is Range {
  return v != null && v in RANGES;
}

/** Returns null when this symbol has no USDT pair, so the page can say so
 *  instead of rendering an empty chart frame. */
export async function getCandles(
  symbol: string,
  range: Range,
): Promise<Point[] | null> {
  const { interval, limit } = RANGES[range];
  const url =
    `https://api.binance.com/api/v3/klines` +
    `?symbol=${encodeURIComponent(symbol.toUpperCase())}USDT` +
    `&interval=${interval}&limit=${limit}`;

  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: 900 } });
  } catch {
    return null;
  }

  // 400 = unknown symbol (no USDT pair). Anything else is also unusable here.
  if (!res.ok) return null;

  const rows = (await res.json()) as unknown;
  if (!Array.isArray(rows) || rows.length < 2) return null;

  const points: Point[] = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const t = Number(row[0]);
    const c = Number(row[4]);
    if (Number.isFinite(t) && Number.isFinite(c)) points.push({ t, c });
  }

  return points.length >= 2 ? points : null;
}
