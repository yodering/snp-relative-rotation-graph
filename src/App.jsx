import { useEffect, useMemo, useState } from "react";
import AnimationControls from "./components/AnimationControls";
import Legend from "./components/Legend";
import LoadingError from "./components/LoadingError";
import RRGChart from "./components/RRGChart";
import { ANIMATION_INTERVAL_MS, TAIL_LENGTH } from "./config/constants";
import { useRRGData } from "./hooks/useRRGData";

export default function App() {
  const { data, loading, error } = useRRGData();
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalMs, setIntervalMs] = useState(ANIMATION_INTERVAL_MS);

  const lastFrame = data ? data.dates.length - 1 : 0;
  const startFrame = useMemo(() => Math.max(0, lastFrame - TAIL_LENGTH * 5), [lastFrame]);

  useEffect(() => {
    if (data) {
      setFrameIndex(lastFrame);
      setIsPlaying(false);
    }
  }, [data, lastFrame]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const id = window.setInterval(() => {
      setFrameIndex((current) => {
        if (current >= lastFrame) {
          window.clearInterval(id);
          setIsPlaying(false);
          return lastFrame;
        }
        return current + 1;
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, isPlaying, lastFrame]);

  if (loading) {
    return <LoadingError loading />;
  }

  if (error) {
    return <LoadingError error={error} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "#fff",
        padding: "24px"
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "8px" }}>S&amp;P Sector Relative Rotation Graph</h1>
        <p style={{ marginTop: 0, color: "rgba(255,255,255,0.72)", marginBottom: "24px" }}>
          JdK RS-Ratio versus JdK RS-Momentum for major sector ETFs relative to SPY.
        </p>

        <RRGChart data={data} frameIndex={frameIndex} />

        <AnimationControls
          currentDate={data.dates[frameIndex]}
          currentFrame={frameIndex}
          intervalMs={intervalMs}
          isPlaying={isPlaying}
          onPause={() => setIsPlaying(false)}
          onPlay={() => {
            setFrameIndex(startFrame);
            setIsPlaying(true);
          }}
          onReset={() => {
            setIsPlaying(false);
            setFrameIndex(lastFrame);
          }}
          onSpeedChange={setIntervalMs}
          totalFrames={data.dates.length}
        />

        <Legend />
      </div>
    </div>
  );
}