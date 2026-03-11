# Codex Task: Build a Relative Rotation Graph (RRG) for S&P Sectors

## Overview

Build a **React application** that renders an interactive **Relative Rotation Graph (RRG)** comparing S&P sector ETFs against the SPY benchmark. Use the **Alpaca Markets API** for historical price data. Split the code across multiple files for clarity and maintainability.

---

## What is an RRG?

A Relative Rotation Graph plots each asset on a 2D plane:

- **X-axis: JdK RS-Ratio** — measures relative strength of the sector vs. the benchmark (SPY). Values above 100 mean the sector is outperforming; below 100 means underperforming.
- **Y-axis: JdK RS-Momentum** — measures the rate of change of the RS-Ratio. Values above 100 mean relative strength is improving; below 100 means deteriorating.

The chart is divided into **four quadrants** (centered at 100, 100):

| Quadrant | Location | Meaning |
|----------------|-----------------|----------------------------------------|
| **Leading** | Top-right | Outperforming and improving |
| **Weakening** | Bottom-right | Outperforming but losing momentum |
| **Lagging** | Bottom-left | Underperforming and deteriorating |
| **Improving** | Top-left | Underperforming but gaining momentum |

Each sector is plotted as a point with a **tail** (trail of past positions) showing its trajectory through the quadrants over time.

---

## Sectors to Include

```
XLB  — Materials
XLC  — Communication Services
XLE  — Energy
XLF  — Financials
XLI  — Industrials
XLK  — Technology
XLP  — Consumer Staples
XHB  — Homebuilders
XLU  — Utilities
XLV  — Health Care
XLY  — Consumer Discretionary
XLRE — Real Estate
```

Benchmark: **SPY**

---

## Project Structure

```
src/
├── config/
│   └── constants.js          # API keys, sector definitions, colors, chart settings
├── api/
│   └── alpaca.js             # Alpaca API fetch logic (bars endpoint)
├── utils/
│   ├── indicators.js         # SMA, EMA helper functions
│   └── rrg.js                # RS line, JdK RS-Ratio, JdK RS-Momentum calculations
├── components/
│   ├── RRGChart.jsx          # Main D3/SVG chart: quadrants, axes, dots, tails
│   ├── Legend.jsx             # Color-coded sector legend
│   ├── AnimationControls.jsx # Play / Pause / Reset buttons + speed control
│   └── LoadingError.jsx      # Loading spinner and error display
├── hooks/
│   └── useRRGData.js         # Custom hook: fetch data, compute RRG coords, manage state
└── App.jsx                   # Top-level layout, composes everything
```

---

## File-by-File Specifications

### `src/config/constants.js`

Export:
```js
export const ALPACA_API_KEY = "YOUR_API_KEY_HERE";
export const ALPACA_SECRET_KEY = "YOUR_SECRET_KEY_HERE";
export const ALPACA_BASE_URL = "https://data.alpaca.markets/v2/stocks/bars";

export const BENCHMARK = "SPY";

export const SECTORS = [
  { ticker: "XLB",  name: "Materials",              color: "#e6194b" },
  { ticker: "XLC",  name: "Communication Services",  color: "#3cb44b" },
  { ticker: "XLE",  name: "Energy",                  color: "#ffe119" },
  { ticker: "XLF",  name: "Financials",              color: "#4363d8" },
  { ticker: "XLI",  name: "Industrials",             color: "#f58231" },
  { ticker: "XLK",  name: "Technology",              color: "#911eb4" },
  { ticker: "XLP",  name: "Consumer Staples",        color: "#42d4f4" },
  { ticker: "XHB",  name: "Homebuilders",            color: "#f032e6" },
  { ticker: "XLU",  name: "Utilities",               color: "#bfef45" },
  { ticker: "XLV",  name: "Health Care",             color: "#fabed4" },
  { ticker: "XLY",  name: "Consumer Discretionary",  color: "#dcbeff" },
  { ticker: "XLRE", name: "Real Estate",             color: "#9A6324" },
];

// RRG calculation parameters
export const RS_PERIOD = 10;       // SMA lookback for RS normalization
export const EMA_PERIOD = 10;      // EMA smoothing period
export const TAIL_LENGTH = 8;      // Number of trailing points to show
export const LOOKBACK_MONTHS = 8;  // How far back to fetch (need warmup room)

// Animation
export const ANIMATION_INTERVAL_MS = 500;
```

---

### `src/api/alpaca.js`

Export an async function that fetches daily bars for all sector tickers + SPY in a single request.

**Endpoint:**
```
GET {ALPACA_BASE_URL}?symbols={comma-separated}&timeframe=1Day&start={ISO date}&end={ISO date}&limit=10000&feed=sip
```

**Headers:**
```
APCA-API-KEY-ID: {ALPACA_API_KEY}
APCA-API-SECRET-KEY: {ALPACA_SECRET_KEY}
```

**Response shape:** `response.bars` is an object keyed by symbol. Each value is an array of bar objects: `{ t, o, h, l, c, v }`. Use the `c` (close) field and `t` (timestamp) field.

**Return:** A clean object like `{ SPY: [{date, close}, ...], XLK: [{date, close}, ...], ... }` sorted by date ascending.

Handle errors (bad auth, network failure) by throwing descriptive errors that the hook can catch.

---

### `src/utils/indicators.js`

Export pure functions:

```js
/**
 * Simple Moving Average
 * @param {number[]} data - array of values
 * @param {number} period - lookback window
 * @returns {(number|null)[]} - array same length as data, null where insufficient history
 */
export function sma(data, period) { ... }

/**
 * Exponential Moving Average
 * @param {number[]} data - array of values
 * @param {number} period - EMA period
 * @returns {(number|null)[]} - array same length as data, null where insufficient history
 */
export function ema(data, period) { ... }
```

EMA formula: `multiplier = 2 / (period + 1)`, seed with SMA of first `period` values, then `EMA[i] = (value - EMA[i-1]) * multiplier + EMA[i-1]`.

---

### `src/utils/rrg.js`

Export a function that takes the full price data object and returns RRG coordinates per sector over time.

**Algorithm for each sector:**

1. **RS line:** `RS[i] = (sector_close[i] / spy_close[i]) * 100`

2. **RS-Ratio:**
   - Compute `RS_ratio_raw[i] = (RS[i] / SMA(RS, RS_PERIOD)[i]) * 100`
   - Smooth: `RS_Ratio = EMA(RS_ratio_raw, EMA_PERIOD)`

3. **RS-Momentum:**
   - Compute `RS_momentum_raw[i] = (RS_Ratio[i] / SMA(RS_Ratio, RS_PERIOD)[i]) * 100`
   - Smooth: `RS_Momentum = EMA(RS_momentum_raw, EMA_PERIOD)`

**Return shape:**
```js
{
  // Array of date strings for each valid data point (after warmup)
  dates: ["2025-10-01", "2025-10-02", ...],
  // Per-sector coordinate arrays, aligned to dates
  sectors: {
    XLK: { ratio: [100.2, 100.5, ...], momentum: [99.8, 100.1, ...] },
    XLE: { ... },
    ...
  }
}
```

Strip leading nulls so every returned index is plottable.

---

### `src/hooks/useRRGData.js`

Custom hook that:
1. On mount, calls the Alpaca fetch function.
2. Passes result through the RRG computation.
3. Exposes: `{ data, loading, error }` where `data` is the return shape from `rrg.js`.

---

### `src/components/RRGChart.jsx`

The main chart component. Receives `data` (from the hook) and `frameIndex` (current animation frame, an index into the `dates` array).

**Rendering (use D3 + SVG):**

- **Dimensions:** responsive width, ~600px height. Use a `useRef` for the SVG and D3 bindings.
- **Scales:** `d3.scaleLinear()` for both axes. Auto-fit domain to the data range with some padding, but always include 100 in both ranges. Typical range is ~96–104.
- **Quadrant fills:** Four `<rect>` elements behind everything with subtle semi-transparent colors:
  - Top-right (Leading): `rgba(0, 200, 0, 0.08)`
  - Bottom-right (Weakening): `rgba(255, 200, 0, 0.08)`
  - Bottom-left (Lagging): `rgba(200, 0, 0, 0.08)`
  - Top-left (Improving): `rgba(0, 100, 255, 0.08)`
- **Quadrant labels:** "Leading", "Weakening", "Lagging", "Improving" in their respective corners, subtle/muted text.
- **Crosshairs:** Dashed lines at x=100 and y=100.
- **Axes:** Standard D3 axes with gridlines, labels "JdK RS-Ratio →" and "JdK RS-Momentum →".
- **Sector dots:** For each sector at `frameIndex`, draw a filled circle at `(ratio[frameIndex], momentum[frameIndex])` in the sector's color.
- **Ticker labels:** Text label next to each dot with the ticker name.
- **Tails:** For each sector, draw a polyline from `frameIndex - TAIL_LENGTH` to `frameIndex`. Use decreasing opacity or thinner stroke for older points. The tail shows the sector's recent trajectory.

**Dark theme:** Background `#1a1a2e` or similar. White/light text and axis lines. Subtle quadrant fills that don't overpower.

---

### `src/components/Legend.jsx`

A simple grid/flex layout showing each sector's color swatch, ticker, and full name. Positioned below or beside the chart.

---

### `src/components/AnimationControls.jsx`

Props: `{ isPlaying, onPlay, onPause, onReset, currentFrame, totalFrames }`

Render:
- **Play/Pause** toggle button
- **Reset** button (jumps to starting frame)
- A small **progress indicator** or frame counter (e.g., "Week 5 / 32" or a date display)
- Optionally a **speed slider** (adjust interval between 200–1000ms)

---

### `src/components/LoadingError.jsx`

- If loading: show a centered spinner or pulsing text.
- If error: show the error message in red with a note to check API keys if it's an auth error.

---

### `src/App.jsx`

Composes everything:

```jsx
export default function App() {
  const { data, loading, error } = useRRGData();
  const [frameIndex, setFrameIndex] = useState(/* last frame */);
  const [isPlaying, setIsPlaying] = useState(false);

  // Animation: useEffect with setInterval that increments frameIndex
  // when isPlaying is true. Stops when frameIndex reaches end.

  // On data load, default frameIndex to the last available index
  // (show current state). Animation rewinds to (end - TAIL_LENGTH * ~5)
  // and plays forward.

  if (loading) return <LoadingError loading />;
  if (error) return <LoadingError error={error} />;

  return (
    <div style={{ background: "#1a1a2e", minHeight: "100vh", color: "#fff", padding: 24 }}>
      <h1>S&P Sector Relative Rotation Graph</h1>
      <RRGChart data={data} frameIndex={frameIndex} />
      <AnimationControls
        isPlaying={isPlaying}
        onPlay={() => { setFrameIndex(startFrame); setIsPlaying(true); }}
        onPause={() => setIsPlaying(false)}
        onReset={() => { setIsPlaying(false); setFrameIndex(lastFrame); }}
        currentFrame={frameIndex}
        totalFrames={data.dates.length}
      />
      <Legend />
    </div>
  );
}
```

---

## Data Source: Alpaca Markets API

**Important implementation details:**

- Fetch daily bars for all 13 symbols (12 sectors + SPY) in a **single API call** using comma-separated symbols parameter.
- Date range: `start` = 8 months ago, `end` = today (ISO 8601 format).
- Align dates across all symbols — only keep dates where ALL symbols have data (inner join on date). This handles days where a symbol might be missing a bar.
- Sort by date ascending after parsing.

---

## JdK Calculation Summary (quick reference)

```
For each sector:
  RS[i] = (sector_close[i] / spy_close[i]) * 100
  RS_ratio_raw[i] = (RS[i] / SMA(RS, 10)[i]) * 100
  RS_Ratio[i] = EMA(RS_ratio_raw, 10)[i]
  RS_momentum_raw[i] = (RS_Ratio[i] / SMA(RS_Ratio, 10)[i]) * 100
  RS_Momentum[i] = EMA(RS_momentum_raw, 10)[i]

Plot: x = RS_Ratio, y = RS_Momentum, center = (100, 100)
```

---

## Key Behaviors

1. **On load:** fetch data → compute → show chart at latest frame (current positions with tails).
2. **Play button:** rewind to an earlier frame, animate forward at ~500ms/step, growing tails as it goes.
3. **Pause:** freeze at current frame.
4. **Reset:** jump back to latest frame (current state), stop animation.
5. **Hover (stretch goal):** tooltips showing sector name, RS-Ratio, RS-Momentum values on dot hover.

---

## Don't Forget

- API keys are **placeholders** — the user will fill them in. Make this obvious with a comment and/or the error state.
- Handle the Alpaca response correctly: `response.bars` is the top-level key, then symbol keys underneath.
- The EMA seed value must be the SMA of the first N points, not just the first value.
- Make sure dates are aligned across all symbols before computing ratios.
- The chart should look good out of the box — dark theme, readable labels, distinct sector colors.
