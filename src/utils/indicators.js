export function sma(data, period) {
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error("SMA period must be a positive integer.");
  }

  return data.map((_, index) => {
    if (index < period - 1) {
      return null;
    }

    const window = data.slice(index - period + 1, index + 1);
    if (!window.every((value) => Number.isFinite(value))) {
      return null;
    }

    return window.reduce((sum, value) => sum + value, 0) / period;
  });
}

export function ema(data, period) {
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error("EMA period must be a positive integer.");
  }

  const result = new Array(data.length).fill(null);
  const multiplier = 2 / (period + 1);

  let seedIndex = -1;
  for (let index = period - 1; index < data.length; index += 1) {
    const window = data.slice(index - period + 1, index + 1);
    if (window.every((value) => Number.isFinite(value))) {
      result[index] = window.reduce((sum, value) => sum + value, 0) / period;
      seedIndex = index;
      break;
    }
  }

  if (seedIndex === -1) {
    return result;
  }

  for (let index = seedIndex + 1; index < data.length; index += 1) {
    const value = data[index];
    const previous = result[index - 1];
    if (!Number.isFinite(value) || !Number.isFinite(previous)) {
      continue;
    }
    result[index] = (value - previous) * multiplier + previous;
  }

  return result;
}