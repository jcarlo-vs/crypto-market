import fixture from "./fixtures/listings.json";

/** CoinMarketCap listings. ONE call returns the whole table, and Next's fetch
 *  cache is shared across visitors, so API usage is flat no matter the traffic:
 *
 *    (60 / 5 min) * 24 * 30 = 8,640 calls/month  vs  the free tier's 15,000
 *
 *  Coin pages read this same cached list, so they cost zero extra credits.
 *
 *  ponytail: CMC bills some endpoints per 100 data points rather than per call.
 *  Watch the credit counter in the CMC dashboard for a day; if it drains faster
 *  than ~290/day, raise CMC_REVALIDATE_SECONDS. That is the only knob needed.
 */

const ENDPOINT =
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest";

const LIMIT = 200;
const REVALIDATE = Number(process.env.CMC_REVALIDATE_SECONDS ?? 300);

export type Coin = {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  fdv: number;
  volume24h: number;
  circulatingSupply: number;
  maxSupply: number | null;
  lastUpdated: string;
};

type RawQuote = {
  price?: number;
  volume_24h?: number;
  percent_change_1h?: number;
  percent_change_24h?: number;
  percent_change_7d?: number;
  market_cap?: number;
  fully_diluted_market_cap?: number;
  last_updated?: string;
};

type RawListing = {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank?: number;
  circulating_supply?: number;
  max_supply?: number | null;
  quote?: { USD?: RawQuote };
};

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : NaN);

/** Raw CMC row -> our shape. Exported for the test: this mapper is where a
 *  renamed API field would silently turn every market cap into NaN. */
export function mapListing(raw: RawListing): Coin {
  const q = raw.quote?.USD ?? {};
  return {
    id: raw.id,
    name: raw.name,
    symbol: raw.symbol,
    slug: raw.slug,
    rank: num(raw.cmc_rank),
    price: num(q.price),
    change1h: num(q.percent_change_1h),
    change24h: num(q.percent_change_24h),
    change7d: num(q.percent_change_7d),
    marketCap: num(q.market_cap),
    fdv: num(q.fully_diluted_market_cap),
    volume24h: num(q.volume_24h),
    circulatingSupply: num(raw.circulating_supply),
    maxSupply: raw.max_supply ?? null,
    lastUpdated: q.last_updated ?? "",
  };
}

export type Listings = {
  coins: Coin[];
  /** True when serving the bundled fixture because no API key is configured. */
  sample: boolean;
};

export async function getCoins(): Promise<Listings> {
  const key = process.env.COINMARKETCAP_API_KEY;

  if (!key) {
    return { coins: (fixture.data as RawListing[]).map(mapListing), sample: true };
  }

  const res = await fetch(`${ENDPOINT}?limit=${LIMIT}&convert=USD`, {
    headers: { "X-CMC_PRO_API_KEY": key, Accept: "application/json" },
    next: { revalidate: REVALIDATE },
  });

  if (!res.ok) {
    // Next keeps serving the last good cached response while a revalidation
    // fails, so this only surfaces on a cold cache.
    throw new Error(`CoinMarketCap returned ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as { data?: RawListing[] };
  const rows = body.data ?? [];
  if (rows.length === 0) throw new Error("CoinMarketCap returned no rows");

  return { coins: rows.map(mapListing), sample: false };
}

export async function getCoinBySlug(
  slug: string,
): Promise<{ coin: Coin | null; sample: boolean }> {
  const { coins, sample } = await getCoins();
  return { coin: coins.find((c) => c.slug === slug) ?? null, sample };
}
