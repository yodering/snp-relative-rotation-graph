import { ALPACA_PROXY_ENDPOINT } from "../config/constants";

export async function fetchHistoricalBars() {
  let response;
  try {
    response = await fetch(ALPACA_PROXY_ENDPOINT);
  } catch (error) {
    throw new Error(`Failed to reach the app server: ${error.message}`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error("The app server returned an unreadable response.");
  }

  if (!response.ok) {
    const message = payload?.error || payload?.message || response.statusText;
    throw new Error(message);
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("The app server returned an invalid payload.");
  }

  return payload;
}