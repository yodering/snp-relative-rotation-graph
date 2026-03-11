import { useEffect, useMemo, useState } from "react";
import { fetchHistoricalBars } from "../api/alpaca";
import { aggregateToWeekly, computeRRGData } from "../utils/rrg";

export function useRRGData(resolution) {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const prices = await fetchHistoricalBars();
        if (isMounted) {
          setRawData(prices);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Failed to load RRG data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const data = useMemo(() => {
    if (!rawData) {
      return null;
    }

    const normalizedData = resolution === "weekly" ? aggregateToWeekly(rawData) : rawData;
    return computeRRGData(normalizedData);
  }, [rawData, resolution]);

  return { data, loading, error };
}
