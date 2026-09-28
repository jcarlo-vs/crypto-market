import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell">
      <div className="masthead">
        <span className="wordmark">
          <Link href="/">
            CRYPTO<b>/</b>MARKET
          </Link>
        </span>
        <span className="meta">404</span>
      </div>
      <p className="empty" style={{ marginTop: 40 }}>
        That asset is not in the top 200 by market cap.
        <br />
        <br />
        <Link href="/" style={{ color: "var(--green)" }}>
          ← Back to the market
        </Link>
      </p>
    </main>
  );
}
