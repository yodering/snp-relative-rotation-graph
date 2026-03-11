import {
  ALPACA_API_KEY,
  ALPACA_BASE_URL,
  ALPACA_FEED,
  ALPACA_SECRET_KEY,
  BENCHMARK,
  LOOKBACK_MONTHS,
  SECTORS
} from "../config/constants";

function formatDate(date) {
  return date.toISOString();
}

function getDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - LOOKBACK_MONTHS);
  return { start: formatDate(start), end: formatDate(end) };
}

function normalizeBars(responseBars) {
  const symbols = [BENCHMARK, ...SECTORS.map((sector) => sector.ticker)];
  const perSymbol = Object.fromEntries(
    symbols.map((symbol) => {
      const bars = Array.isArray(responseBars?.[symbol]) ? responseBars[symbol] : [];
      const cleaned = bars
        .map((bar) => ({
          date: new Date(bar.t).toISOString().slice(0, 10),
          close: Number(bar.c)
        }))
        .filter((bar) => Number.isFinite(bar.close))
        .sort((a, b) => a.date.localeCompare(b.date));

      return [symbol, cleaned];
    })
  );

  const sharedDates = symbols.reduce((accumulator, symbol) => {
    const dates = new Set(perSymbol[symbol].map((bar) => bar.date));
    if (!accumulator) {
      return dates;
    }

    return new Set([...accumulator].filter((date) => dates.has(date)));
  }, null);

  const alignedDates = [...(sharedDates ?? [])].sort((a, b) => a.localeCompare(b));

  return Object.fromEntries(
    symbols.map((symbol) => {
      const barByDate = new Map(perSymbol[symbol].map((bar) => [bar.date, bar]));
      return [symbol, alignedDates.map((date) => barByDate.get(date))];
    })
  );
}

export async function fetchHistoricalBars() {
  if (
    !ALPACA_API_KEY ||
    !ALPACA_SECRET_KEY ||
    ALPACA_API_KEY === "YOUR_API_KEY_HERE" ||
    ALPACA_SECRET_KEY === "YOUR_SECRET_KEY_HERE"
  ) {
    throw new Error("Alpaca API keys are missing. Add VITE_ALPACA_API_KEY and VITE_ALPACA_SECRET_KEY.");
  }

  const { start, end } = getDateRange();
  const symbols = [BENCHMARK, ...SECTORS.map((sector) => sector.ticker)].join(",");
  const params = new URLSearchParams({
    symbols,
    timeframe: "1Day",
    start,
    end,
    limit: "10000",
    feed: ALPACA_FEED
  });

  let response;
  try {
    response = await fetch(`${ALPACA_BASE_URL}?${params.toString()}`, {
      headers: {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY
      }
    });
  } catch (error) {
    throw new Error(`Failed to reach Alpaca Markets API: ${error.message}`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error("Alpaca Markets API returned an unreadable response.");
  }

  if (!response.ok) {
    const message = payload?.message || payload?.code || response.statusText;
    const authHint = response.status === 401 || response.status === 403 ? " Check API keys." : "";
    throw new Error(`Alpaca request failed (${response.status}): ${message}.${authHint}`.trim());
  }

  if (!payload?.bars || typeof payload.bars !== "object") {
    throw new Error("Alpaca response is missing the expected bars payload.");
  }

  return normalizeBars(payload.bars);
}