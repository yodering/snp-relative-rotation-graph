import { useEffect, useMemo, useState } from "react";
import AnimationControls from "./components/AnimationControls";
import Legend from "./components/Legend";
import LoadingError from "./components/LoadingError";
import PriceTimeline from "./components/PriceTimeline";
import RRGChart from "./components/RRGChart";
import { ANIMATION_INTERVAL_MS, TAIL_LENGTH } from "./config/constants";
import { useRRGData } from "./hooks/useRRGData";

export default function App() {
  const { data, loading, error } = useRRGData();
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalMs, setIntervalMs] = useState(ANIMATION_INTERVAL_MS);
  const [zoomLevel, setZoomLevel] = useState(1.4);

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

  const currentPrice = data.benchmark.prices[frameIndex];

  return (
    <div className="app-shell">
      <div className="app-frame">
        <div className="hero-copy">
          <p className="eyebrow">Relative strength rotation</p>
          <h1>S&amp;P sector rotation with a fixed RRG viewport</h1>
          <p className="hero-description">
            The graph stays anchored around the 100 / 100 crosshair while the SPY price strip below
            acts as the scrubber through time.
          </p>
        </div>
        <RRGChart data={data} frameIndex={frameIndex} zoomLevel={zoomLevel} />

        <PriceTimeline
          currentFrame={frameIndex}
          currentPrice={currentPrice}
          dates={data.dates}
          onFrameChange={(nextFrame) => {
            setIsPlaying(false);
            setFrameIndex(nextFrame);
          }}
          prices={data.benchmark.prices}
        />

        <AnimationControls
          currentDate={data.dates[frameIndex]}
          currentFrame={frameIndex}
          currentPrice={currentPrice}
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
          onZoomChange={setZoomLevel}
          totalFrames={data.dates.length}
          zoomLevel={zoomLevel}
        />

        <Legend />
      </div>
    </div>
  );
}
