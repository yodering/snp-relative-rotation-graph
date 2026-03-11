export default function LoadingError({ error, loading }) {
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
            Fetching Alpaca daily bars and computing JdK values.
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: "640px", textAlign: "center" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ff7b7b" }}>Unable to load data</div>
          <div style={{ marginTop: "10px", color: "rgba(255,255,255,0.8)" }}>{error}</div>
          {String(error).toLowerCase().includes("api key") ||
          String(error).toLowerCase().includes("401") ||
          String(error).toLowerCase().includes("403") ? (
            <div style={{ marginTop: "10px", color: "rgba(255,255,255,0.65)" }}>
              Check the placeholder credentials in `src/config/constants.js`.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}