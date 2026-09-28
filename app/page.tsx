import { getCoins } from "@/lib/cmc";
import { formatAge } from "@/lib/format";
import MarketTable from "./_components/market-table";

export default async function Home() {
  let coins = null;
  let sample = false;
  let error: string | null = null;

  try {
    const listings = await getCoins();
    coins = listings.coins;
    sample = listings.sample;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const updated = coins?.[0]?.lastUpdated;

  return (
    <main className="shell">
      <div className="masthead">
        <span className="wordmark">
          CRYPTO<b>/</b>MARKET
        </span>
        <span className="meta">
          {error ? (
            <>feed offline</>
          ) : (
            <>
              <span className="on">●</span> {coins?.length ?? 0} assets · updated{" "}
              {formatAge(updated)}
            </>
          )}
        </span>
      </div>

      {sample && (
        <p className="banner">
          SAMPLE DATA — these prices are invented, not real. Add{" "}
          <code>COINMARKETCAP_API_KEY</code> to <code>.env.local</code> for live
          market data.
        </p>
      )}

      {error && (
        <p className="banner err">
          Could not reach CoinMarketCap: {error}. Nothing is cached yet, so there
          is nothing to show — retry in a moment.
        </p>
      )}

      {coins && <MarketTable coins={coins} />}

      <footer>
        <span>Market data: CoinMarketCap · Charts: Binance</span>
        <span>Information only — not financial advice.</span>
      </footer>
    </main>
  );
}
