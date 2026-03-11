export default function AnimationControls({
  currentPrice,
  currentDate,
  currentFrame,
  intervalMs,
  isPlaying,
  onPause,
  onPlay,
  onReset,
  onSpeedChange,
  totalFrames
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 18px",
        marginTop: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px"
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button type="button" onClick={isPlaying ? onPause : onPlay} style={buttonStyle}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={onReset} style={secondaryButtonStyle}>
          Reset
        </button>
      </div>

      <div>
        <div style={{ fontWeight: 700 }}>
          Frame {Math.min(currentFrame + 1, totalFrames)} / {totalFrames}
        </div>
        <div style={{ color: "rgba(255,255,255,0.7)" }}>{currentDate ?? "No date loaded"}</div>
        <div style={{ color: "rgba(255,255,255,0.92)", marginTop: "4px", fontWeight: 600 }}>
          SPY {Number.isFinite(currentPrice) ? `$${currentPrice.toFixed(2)}` : "--"}
        </div>
      </div>

      <label style={{ display: "grid", gap: "6px", minWidth: "220px" }}>
        <span style={{ color: "rgba(255,255,255,0.8)" }}>Speed: {intervalMs} ms</span>
        <input
          type="range"
          min="200"
          max="1000"
          step="100"
          value={intervalMs}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
        />
      </label>
    </div>
  );
}

const buttonStyle = {
  border: "none",
  background: "#4d79ff",
  color: "#fff",
  borderRadius: "10px",
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 700
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "rgba(255,255,255,0.1)"
};
