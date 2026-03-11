export default function AnimationControls({
  currentPrice,
  currentDate,
  currentFrame,
  intervalMs,
  isPlaying,
  onFrequencyChange,
  onPause,
  onPlay,
  onReset,
  onSpeedChange,
  onTailLengthChange,
  onZoomChange,
  resolution,
  tailLength,
  totalFrames,
  zoomLevel
}) {
  const speedOptions = [
    { label: "Slow", value: 800 },
    { label: "Normal", value: 500 },
    { label: "Fast", value: 250 }
  ];

  const zoomOptions = [
    { label: "Wide", value: 1 },
    { label: "Close", value: 1.6 },
    { label: "Tight", value: 2.2 }
  ];

  return (
    <section className="chart-toolbar">
      <div className="toolbar-block">
        <div className="toolbar-label">Closes</div>
        <div className="toolbar-chip-row">
          {[
            { label: "Daily", value: "daily" },
            { label: "Weekly", value: "weekly" }
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onFrequencyChange(option.value)}
              style={option.value === resolution ? activeChipStyle : chipStyle}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-block">
        <div className="toolbar-label">Playback</div>
        <div className="toolbar-actions">
          <button type="button" onClick={isPlaying ? onPause : onPlay} style={buttonStyle}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={onReset} style={secondaryButtonStyle}>
            Latest
          </button>
        </div>
      </div>

      <div className="toolbar-block toolbar-status">
        <div className="toolbar-label">Current frame</div>
        <div className="toolbar-metric">
          Frame {Math.min(currentFrame + 1, totalFrames)} / {totalFrames}
        </div>
        <div className="toolbar-subtle">{currentDate ?? "No date loaded"}</div>
        <div className="toolbar-price">SPY {Number.isFinite(currentPrice) ? `$${currentPrice.toFixed(2)}` : "--"}</div>
      </div>

      <div className="toolbar-block toolbar-slider-block">
        <div className="toolbar-label">Tail length</div>
        <div className="toolbar-metric">{tailLength} periods</div>
        <input
          className="toolbar-range"
          type="range"
          min="3"
          max="16"
          step="1"
          value={tailLength}
          onChange={(event) => onTailLengthChange(Number(event.target.value))}
        />
      </div>

      <div className="toolbar-block">
        <div className="toolbar-label">Speed</div>
        <div className="toolbar-chip-row">
          {speedOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onSpeedChange(option.value)}
              style={option.value === intervalMs ? activeChipStyle : chipStyle}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-block">
        <div className="toolbar-label">Zoom</div>
        <div className="toolbar-chip-row">
          {zoomOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onZoomChange(option.value)}
              style={option.value === zoomLevel ? activeChipStyle : chipStyle}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const buttonStyle = {
  border: "none",
  background: "#4d79ff",
  color: "#fff",
  borderRadius: "999px",
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 700
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "rgba(255,255,255,0.1)"
};

const chipStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(237,242,255,0.86)",
  borderRadius: "999px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 700
};

const activeChipStyle = {
  ...chipStyle,
  background: "rgba(77,121,255,0.22)",
  border: "1px solid rgba(120,163,255,0.44)",
  color: "#ffffff"
};
