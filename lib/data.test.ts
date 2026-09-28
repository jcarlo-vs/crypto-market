import { describe, expect, it } from "vitest";
import fixture from "./fixtures/listings.json";
import { buildGeom } from "./chart";
import { mapListing } from "./cmc";
import {
  formatCompact,
  formatPercent,
  formatPrice,
  formatSupply,
} from "./format";

describe("formatters", () => {
  it("scales decimals to the size of the price", () => {
    expect(formatPrice(64250.12)).toBe("$64,250.12");
    expect(formatPrice(1.0001)).toBe("$1.00");
    expect(formatPrice(0.3876)).toBe("$0.3876");
    expect(formatPrice(0.00001842)).toBe("$0.00001842");
  });

  it("shows a dash rather than inventing a number", () => {
    expect(formatPrice(NaN)).toBe("—");
    expect(formatPrice(null)).toBe("—");
    expect(formatPercent(undefined)).toBe("—");
    expect(formatCompact(0)).toBe("—");
  });

  it("signs percentages so green/red is never the only cue", () => {
    expect(formatPercent(4.62)).toBe("+4.62%");
    expect(formatPercent(-1.84)).toBe("-1.84%");
    expect(formatPercent(0)).toBe("+0.00%");
  });

  it("abbreviates large money", () => {
    expect(formatCompact(1276650000000)).toBe("$1.28T");
    expect(formatCompact(80611660000)).toBe("$80.61B");
    expect(formatCompact(158000000)).toBe("$158.00M");
    expect(formatCompact(589000000000000, "")).toBe("589.00T");
  });

  it("reads a null supply cap as uncapped, not zero", () => {
    expect(formatSupply(null)).toBe("Uncapped");
    expect(formatSupply(0)).toBe("Uncapped");
    expect(formatSupply(21000000)).toBe("21.00M");
  });
});

describe("mapListing", () => {
  it("maps every fixture row to finite numbers", () => {
    const coins = fixture.data.map(mapListing);
    expect(coins).toHaveLength(12);
    for (const c of coins) {
      expect(c.slug).toBeTruthy();
      expect(Number.isFinite(c.price)).toBe(true);
      expect(Number.isFinite(c.marketCap)).toBe(true);
      expect(Number.isFinite(c.change24h)).toBe(true);
    }
    const btc = coins[0];
    expect(btc.symbol).toBe("BTC");
    expect(btc.price).toBe(64250.12);
    expect(btc.maxSupply).toBe(21000000);
  });

  it("survives a renamed or missing quote block instead of throwing", () => {
    const coin = mapListing({
      id: 1,
      name: "Ghost",
      symbol: "GHO",
      slug: "ghost",
    });
    expect(coin.slug).toBe("ghost");
    expect(Number.isNaN(coin.price)).toBe(true);
    expect(coin.maxSupply).toBeNull();
  });
});

describe("buildGeom", () => {
  const series = [100, 110, 90, 120].map((c, i) => ({ t: i * 1000, c }));

  it("spans the full width and respects the vertical padding", () => {
    const g = buildGeom(series, 400, 100)!;
    expect(g).not.toBeNull();
    expect(g.low).toBe(90);
    expect(g.high).toBe(120);
    expect(g.coords[0].x).toBe(0);
    expect(g.coords[3].x).toBe(400);
    expect(g.highY).toBe(14);
    expect(g.lowY).toBe(74);
    expect(g.line.startsWith("M0.00 ")).toBe(true);
  });

  it("refuses to plot what cannot be plotted", () => {
    expect(buildGeom([], 400, 100)).toBeNull();
    expect(buildGeom([{ t: 0, c: 1 }], 400, 100)).toBeNull();
    expect(buildGeom(series, 0, 100)).toBeNull();
  });

  it("centres a flat series instead of dividing by zero", () => {
    const flat = [5, 5, 5].map((c, i) => ({ t: i, c }));
    const g = buildGeom(flat, 300, 100)!;
    expect(g.coords.every((c) => c.y === 44)).toBe(true);
    expect(g.line).not.toContain("NaN");
  });
});
