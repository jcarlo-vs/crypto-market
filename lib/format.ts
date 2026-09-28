/** Display formatters. Every one returns a dash for missing/non-finite input
 *  rather than "NaN" or "$0" — a blank cell is honest, a zero is a lie. */

const DASH = "—";

/** Adaptive precision: cheap coins need more decimals than BTC does. */
export function formatPrice(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return DASH;
  const digits = n >= 1 ? 2 : n >= 0.01 ? 4 : 8;
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  );
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return DASH;
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

const UNITS = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
] as const;

/** 1234567890 -> "1.23B". `prefix` is "$" for money, "" for supply counts. */
export function formatCompact(
  n: number | null | undefined,
  prefix = "$",
): string {
  if (n == null || !Number.isFinite(n) || n === 0) return DASH;
  const abs = Math.abs(n);
  for (const [size, suffix] of UNITS) {
    if (abs >= size) return `${prefix}${(n / size).toFixed(2)}${suffix}`;
  }
  return `${prefix}${n.toFixed(0)}`;
}

/** Supply caps: null/0 from the API means "uncapped", not "zero". */
export function formatSupply(n: number | null | undefined): string {
  if (n == null || n === 0) return "Uncapped";
  return formatCompact(n, "");
}

export function formatAge(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
