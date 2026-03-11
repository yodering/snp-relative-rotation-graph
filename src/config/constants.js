export const ALPACA_BASE_URL = "https://data.alpaca.markets/v2/stocks/bars";
export const ALPACA_PROXY_ENDPOINT = "/api/alpaca/bars";

export const BENCHMARK = "SPY";

export const SECTORS = [
  { ticker: "XLB", name: "Materials", color: "#e6194b" },
  { ticker: "XLC", name: "Communication Services", color: "#3cb44b" },
  { ticker: "XLE", name: "Energy", color: "#ffe119" },
  { ticker: "XLF", name: "Financials", color: "#4363d8" },
  { ticker: "XLI", name: "Industrials", color: "#f58231" },
  { ticker: "XLK", name: "Technology", color: "#911eb4" },
  { ticker: "XLP", name: "Consumer Staples", color: "#42d4f4" },
  { ticker: "XHB", name: "Homebuilders", color: "#f032e6" },
  { ticker: "XLU", name: "Utilities", color: "#bfef45" },
  { ticker: "XLV", name: "Health Care", color: "#fabed4" },
  { ticker: "XLY", name: "Consumer Discretionary", color: "#dcbeff" },
  { ticker: "XLRE", name: "Real Estate", color: "#9A6324" }
];

export const RS_PERIOD = 10;
export const EMA_PERIOD = 10;
export const DEFAULT_TAIL_LENGTH = 8;
export const MIN_TAIL_LENGTH = 3;
export const MAX_TAIL_LENGTH = 16;
export const LOOKBACK_MONTHS = 8;

export const ANIMATION_INTERVAL_MS = 500;
