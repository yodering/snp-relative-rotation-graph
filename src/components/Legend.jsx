import { SECTORS } from "../config/constants";

const legendStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
  marginTop: "20px"
};

export default function Legend() {
  return (
    <div style={legendStyle}>
      {SECTORS.map((sector) => (
        <div
          key={sector.ticker}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px"
          }}
        >
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "999px",
              background: sector.color,
              flexShrink: 0
            }}
          />
          <div>
            <div style={{ fontWeight: 700 }}>{sector.ticker}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.92rem" }}>{sector.name}</div>
          </div>
        </div>
      ))}
    </div>
  );
}