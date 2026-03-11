import { useEffect, useState } from "react";
import { fetchHistoricalBars } from "../api/alpaca";
import { computeRRGData } from "../utils/rrg";

export function useRRGData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const prices = await fetchHistoricalBars();
        const rrgData = computeRRGData(prices);
        if (isMounted) {
          setData(rrgData);
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

  return { data, loading, error };
}