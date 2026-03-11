export default function LoadingError({ error, loading }) {
  const normalizedError = String(error || "");
  const lowerError = normalizedError.toLowerCase();
  const isCredentialError =
    lowerError.includes("api key") ||
    lowerError.includes("401") ||
    lowerError.includes("403") ||
    lowerError.includes("alpaca_api_key") ||
    lowerError.includes("alpaca_secret_key");
  const isSipError = lowerError.includes("sip");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#0f1226",
        color: "#fff"
      }}
    >
      {loading ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>Loading RRG data...</div>
          <div style={{ marginTop: "10px", color: "rgba(255,255,255,0.7)" }}>
            Fetching Alpaca daily bars through the app server and computing JdK values.
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: "640px", textAlign: "center" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ff7b7b" }}>Unable to load data</div>
          <div style={{ marginTop: "10px", color: "rgba(255,255,255,0.8)" }}>{error}</div>
          {isSipError ? (
            <div style={{ marginTop: "10px", color: "rgba(255,255,255,0.65)" }}>
              Your Alpaca plan likely does not include recent SIP data. Use `ALPACA_FEED=iex`.
            </div>
          ) : null}
          {isCredentialError && !isSipError ? (
            <div style={{ marginTop: "10px", color: "rgba(255,255,255,0.65)" }}>
              Verify `ALPACA_API_KEY` and `ALPACA_SECRET_KEY` on the server.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}