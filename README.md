# Crypto Market

A CoinMarketCap-style market tracker: top 200 assets by market cap, with a
searchable/sortable table and a per-coin price chart.

Runs on free API tiers by design.

```bash
npm install
npm run dev      # works immediately on bundled sample data
```

## Live data

Copy `.env.example` to `.env.local` and add a free CoinMarketCap **Basic** key
(15,000 call credits/month, 50 req/min, commercial use permitted):

```
COINMARKETCAP_API_KEY=your-key
```

With no key set, the app serves a bundled fixture and labels every page
`SAMPLE DATA`. The invented prices are never presented as real.

## How it stays inside the free tier

The constraint that shapes the whole app: **15,000 credits/month is roughly one
call every three minutes.** You cannot call CoinMarketCap per page view.

- **One call feeds the entire site.** `/cryptocurrency/listings/latest?limit=200`
  returns every row the market table needs. Next's fetch cache is shared across
  visitors, so at `revalidate: 300` that is ~8,640 calls/month **regardless of
  traffic** — 100 visitors or 100,000 cost the same.
- **Coin pages cost zero extra credits.** `getCoinBySlug` reads the same cached
  list rather than hitting a per-coin endpoint.
- **Search costs zero credits.** It filters the already-loaded list in the
  browser. CoinMarketCap's `/search` endpoint would bill per keystroke.
- **Charts never touch the budget.** Candles come from Binance's public API —
  no key, no cost, far higher limits.

No database, no cron job, no ingestion pipeline. Next's cache already decouples
API calls from traffic, which is the only thing those would have bought.

If the credit counter in the CoinMarketCap dashboard drains faster than ~290/day
(some endpoints bill per 100 data points rather than per call), raise
`CMC_REVALIDATE_SECONDS`. That is the only knob.

## Layout

```
lib/format.ts      display formatting — dashes for missing data, never a fake zero
lib/chart.ts       pure line geometry (no DOM, so it is testable)
lib/cmc.ts         CoinMarketCap client + the raw→domain mapper
lib/binance.ts     candles; the only file that knows where price history lives
lib/data.test.ts   10 tests over the formatters, the mapper and the geometry
app/page.tsx                market table
app/coins/[slug]/page.tsx   coin detail — chart, range tabs, key statistics
```

Range tabs are plain links with a `?range=` query, so switching ranges is a
server render with no client-side fetching. The only client components are the
table (search and sort) and the chart (hover crosshair).

```bash
npm test         # vitest
npm run build
```

## Known limits

- **Binance is geo-blocked in some regions** and answers `451`. Charts degrade to
  a "no market" message rather than breaking the page. If you deploy somewhere
  affected, swap the URL inside `getCandles` — no other file knows the source.
- **No sparklines in the table.** CoinMarketCap's listings response has no
  sparkline data, and one Binance call per row would mean 200 requests per page.
- Coins outside the top 200 return 404.

## Not built yet

The **"why did it move"** panel: any asset moving more than ~8% gets a short,
sourced explanation, and says nothing when no real source is found. That is the
feature that makes this more than a clone.

## Attribution

Market data by CoinMarketCap. Price history by Binance. Information only — not
financial advice.
