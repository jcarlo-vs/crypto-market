"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Coin } from "@/lib/cmc";
import { formatCompact, formatPercent, formatPrice } from "@/lib/format";

/** Sortable + searchable market table.
 *  Search filters the already-loaded list in the browser — it costs zero API
 *  calls, where CoinMarketCap's /search endpoint would bill per keystroke. */

type SortKey = "rank" | "price" | "change24h" | "change7d" | "marketCap" | "volume24h";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "price", label: "Price" },
  { key: "change24h", label: "24h" },
  { key: "change7d", label: "7d" },
  { key: "marketCap", label: "Market cap" },
  { key: "volume24h", label: "Volume 24h" },
];

function changeClass(n: number) {
  if (!Number.isFinite(n) || n === 0) return "flat";
  return n > 0 ? "up" : "down";
}

export default function MarketTable({ coins }: { coins: Coin[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [asc, setAsc] = useState(true);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? coins.filter(
          (c) =>
            c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
        )
      : coins;

    return [...filtered].sort((a, b) => {
      const x = a[sortKey];
      const y = b[sortKey];
      // Unknown values sink to the bottom whichever way the column is sorted.
      if (!Number.isFinite(x)) return 1;
      if (!Number.isFinite(y)) return -1;
      return asc ? x - y : y - x;
    });
  }, [coins, query, sortKey, asc]);

  function sortBy(key: SortKey) {
    if (key === sortKey) {
      setAsc(!asc);
      return;
    }
    setSortKey(key);
    // Rank reads best low-to-high; money reads best high-to-low.
    setAsc(key === "rank");
  }

  const caret = (key: SortKey) =>
    key === sortKey ? <span className="car">{asc ? "▲" : "▼"}</span> : null;
  const sortState = (
    key: SortKey,
  ): "ascending" | "descending" | undefined =>
    key === sortKey ? (asc ? "ascending" : "descending") : undefined;

  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">
          Market · {rows.length} {rows.length === 1 ? "asset" : "assets"}
        </span>
        <input
          id="market-search"
          className="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name or symbol"
          aria-label="Filter coins by name or symbol"
        />
      </div>

      <div className="tscroll">
        <table>
          <thead>
            <tr>
              <th aria-sort={sortState("rank")}>
                <button type="button" onClick={() => sortBy("rank")}>
                  # {caret("rank")}
                </button>
              </th>
              <th>Name</th>
              {COLUMNS.map((c) => (
                <th key={c.key} aria-sort={sortState(c.key)}>
                  <button type="button" onClick={() => sortBy(c.key)}>
                    {c.label} {caret(c.key)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="rank">{Number.isFinite(c.rank) ? c.rank : "—"}</td>
                <td>
                  <Link href={`/coins/${c.slug}`}>
                    <span className="cname">{c.name}</span>
                    <span className="csym">{c.symbol}</span>
                  </Link>
                </td>
                <td>{formatPrice(c.price)}</td>
                <td className={changeClass(c.change24h)}>{formatPercent(c.change24h)}</td>
                <td className={changeClass(c.change7d)}>{formatPercent(c.change7d)}</td>
                <td>{formatCompact(c.marketCap)}</td>
                <td>{formatCompact(c.volume24h)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="empty">No asset matches “{query}”.</p>
        )}
      </div>
    </section>
  );
}
