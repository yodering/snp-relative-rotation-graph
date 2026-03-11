import { BENCHMARK, EMA_PERIOD, RS_PERIOD, SECTORS } from "../config/constants";
import { ema, sma } from "./indicators";

function computeSeries(prices, benchmarkPrices) {
  const rsLine = prices.map((price, index) => (price / benchmarkPrices[index]) * 100);
  const rsSma = sma(rsLine, RS_PERIOD);
  const rsRatioRaw = rsLine.map((value, index) => {
    const baseline = rsSma[index];
    return Number.isFinite(baseline) ? (value / baseline) * 100 : null;
  });
  const rsRatio = ema(rsRatioRaw, EMA_PERIOD);
  const ratioSma = sma(rsRatio, RS_PERIOD);
  const rsMomentumRaw = rsRatio.map((value, index) => {
    const baseline = ratioSma[index];
    return Number.isFinite(value) && Number.isFinite(baseline) ? (value / baseline) * 100 : null;
  });
  const rsMomentum = ema(rsMomentumRaw, EMA_PERIOD);

  return { rsRatio, rsMomentum };
}

export function computeRRGData(priceData) {
  const benchmark = priceData?.[BENCHMARK];
  if (!Array.isArray(benchmark) || benchmark.length === 0) {
    throw new Error("Benchmark data is missing or empty.");
  }

  const dates = benchmark.map((bar) => bar.date);
  const benchmarkPrices = benchmark.map((bar) => bar.close);
  const sectorResults = {};

  SECTORS.forEach(({ ticker }) => {
    const bars = priceData[ticker];
    if (!Array.isArray(bars) || bars.length !== benchmark.length) {
      throw new Error(`Sector data for ${ticker} is missing or misaligned.`);
    }

    const prices = bars.map((bar) => bar.close);
    sectorResults[ticker] = computeSeries(prices, benchmarkPrices);
  });

  let firstValidIndex = -1;
  for (let index = 0; index < dates.length; index += 1) {
    const isValid = SECTORS.every(({ ticker }) => {
      const { rsRatio, rsMomentum } = sectorResults[ticker];
      return Number.isFinite(rsRatio[index]) && Number.isFinite(rsMomentum[index]);
    });

    if (isValid) {
      firstValidIndex = index;
      break;
    }
  }

  if (firstValidIndex === -1) {
    throw new Error("Not enough aligned history to compute RRG values.");
  }

  return {
    dates: dates.slice(firstValidIndex),
    benchmark: {
      ticker: BENCHMARK,
      prices: benchmarkPrices.slice(firstValidIndex)
    },
    sectors: Object.fromEntries(
      SECTORS.map(({ ticker }) => [
        ticker,
        {
          ratio: sectorResults[ticker].rsRatio.slice(firstValidIndex),
          momentum: sectorResults[ticker].rsMomentum.slice(firstValidIndex)
        }
      ])
    )
  };
}
