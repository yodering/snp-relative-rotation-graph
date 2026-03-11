import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ALPACA_BASE_URL, BENCHMARK, LOOKBACK_MONTHS, SECTORS } from "./src/config/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");

const app = express();
const port = Number(process.env.PORT || process.env.API_PORT || 8080);

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

function decorateErrorMessage(status, message) {
  const lowerMessage = String(message).toLowerCase();
  if (status === 403 && lowerMessage.includes("sip")) {
    return `${message}. Set ALPACA_FEED=iex or upgrade your Alpaca data subscription.`;
  }

  if (status === 401 || status === 403) {
    return `${message}. Check ALPACA_API_KEY and ALPACA_SECRET_KEY.`;
  }

  return message;
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/alpaca/bars", async (_request, response) => {
  const apiKey = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET_KEY;
  const feed = process.env.ALPACA_FEED || "iex";

  if (!apiKey || !secretKey) {
    response.status(500).json({
      error: "Server env is missing ALPACA_API_KEY or ALPACA_SECRET_KEY."
    });
    return;
  }

  const { start, end } = getDateRange();
  const symbols = [BENCHMARK, ...SECTORS.map((sector) => sector.ticker)].join(",");
  const params = new URLSearchParams({
    symbols,
    timeframe: "1Day",
    start,
    end,
    limit: "10000",
    feed
  });

  let alpacaResponse;
  try {
    alpacaResponse = await fetch(`${ALPACA_BASE_URL}?${params.toString()}`, {
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": secretKey
      }
    });
  } catch (error) {
    response.status(502).json({ error: `Failed to reach Alpaca Markets API: ${error.message}` });
    return;
  }

  let payload;
  try {
    payload = await alpacaResponse.json();
  } catch (error) {
    response.status(502).json({ error: "Alpaca Markets API returned an unreadable response." });
    return;
  }

  if (!alpacaResponse.ok) {
    const rawMessage = payload?.message || payload?.code || alpacaResponse.statusText;
    const message = decorateErrorMessage(alpacaResponse.status, rawMessage);
    response.status(alpacaResponse.status).json({ error: `Alpaca request failed (${alpacaResponse.status}): ${message}` });
    return;
  }

  if (!payload?.bars || typeof payload.bars !== "object") {
    response.status(502).json({ error: "Alpaca response is missing the expected bars payload." });
    return;
  }

  response.json(normalizeBars(payload.bars));
});

app.use(express.static(distDir));

app.get("*", (_request, response) => {
  response.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});