import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DEFAULT_RANGE, getCandles, isRange, RANGES, type Range } from "@/lib/binance";
import { getCoinBySlug } from "@/lib/cmc";
import {
  formatCompact,
  formatPercent,
  formatPrice,
  formatSupply,
} from "@/lib/format";
import PriceChart from "@/app/_components/price-chart";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { coin } = await getCoinBySlug(slug);
  if (!coin) return { title: "Coin not found" };
  return {
    title: `${coin.name} (${coin.symbol}) price — Crypto Market`,
    description: `${coin.name} price, market cap, volume and price history.`,
  };
}

function changeClass(n: number) {
  if (!Number.isFinite(n) || n === 0) return "flat";
  return n > 0 ? "up" : "down";
}

export default async function CoinPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { range: raw } = await searchParams;
  const range: Range = isRange(raw) ? raw : DEFAULT_RANGE;

  const { coin, sample } = await getCoinBySlug(slug);
  if (!coin) notFound();

  // Charts come from Binance, which needs no key — so they are real even when
  // the listing above is sample data. The banner says so rather than blending them.
  const points = await getCandles(coin.symbol, range);

  return (
    <main className="shell">
      <div className="masthead">
        <span className="wordmark">
          <Link href="/">
            CRYPTO<b>/</b>MARKET
          </Link>
        </span>
        <span className="meta">{RANGES[range].label} window</span>
      </div>

      <p className="crumb">
        <Link href="/">← All assets</Link>
      </p>

      <div className="coin-head">
        <h1>{coin.name}</h1>
        <span className="sym">{coin.symbol}</span>
        <span className="badge">
          RANK {Number.isFinite(coin.rank) ? coin.rank : "—"}
        </span>
      </div>

      <div className="bigprice">
        <span className="p">{formatPrice(coin.price)}</span>
        <span className={`d ${changeClass(coin.change24h)}`}>
          {formatPercent(coin.change24h)} · 24h
        </span>
      </div>

      {sample && (
        <p className="banner">
          SAMPLE PRICE — the figures above are invented. The chart below is real
          Binance data.
        </p>
      )}

      <section className="panel">
        <div className="panel-head">
          <span className="panel-title">
            {coin.symbol}/USDT · {RANGES[range].label}
          </span>
          <nav className="ranges" aria-label="Chart range">
            {(Object.keys(RANGES) as Range[]).map((r) => (
              <Link
                key={r}
                href={`/coins/${coin.slug}?range=${r}`}
                aria-current={r === range}
                scroll={false}
              >
                {RANGES[r].label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="chartwrap">
          {points ? (
            <PriceChart points={points} label={`${coin.name} ${RANGES[range].label}`} />
          ) : (
            <p className="nochart">
              No {coin.symbol}/USDT market on Binance, so there is no price
              history to chart.
            </p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <span className="panel-title">Key statistics</span>
        </div>
        <div className="stats">
          <div>
            <div className="k">Market cap</div>
            <div className="v">{formatCompact(coin.marketCap)}</div>
          </div>
          <div>
            <div className="k">Volume 24h</div>
            <div className="v">{formatCompact(coin.volume24h)}</div>
          </div>
          <div>
            <div className="k">Fully diluted</div>
            <div className="v">{formatCompact(coin.fdv)}</div>
          </div>
          <div>
            <div className="k">Circulating</div>
            <div className="v">{formatSupply(coin.circulatingSupply)}</div>
          </div>
          <div>
            <div className="k">Max supply</div>
            <div className="v">{formatSupply(coin.maxSupply)}</div>
          </div>
          <div>
            <div className="k">Change 1h</div>
            <div className={`v ${changeClass(coin.change1h)}`}>
              {formatPercent(coin.change1h)}
            </div>
          </div>
          <div>
            <div className="k">Change 24h</div>
            <div className={`v ${changeClass(coin.change24h)}`}>
              {formatPercent(coin.change24h)}
            </div>
          </div>
          <div>
            <div className="k">Change 7d</div>
            <div className={`v ${changeClass(coin.change7d)}`}>
              {formatPercent(coin.change7d)}
            </div>
          </div>
        </div>
      </section>

      <footer>
        <span>Market data: CoinMarketCap · Charts: Binance</span>
        <span>Information only — not financial advice.</span>
      </footer>
    </main>
  );
}
