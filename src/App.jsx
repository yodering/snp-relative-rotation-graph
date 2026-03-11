import { useEffect, useMemo, useState } from "react";
import AnimationControls from "./components/AnimationControls";
import Legend from "./components/Legend";
import LoadingError from "./components/LoadingError";
import PriceTimeline from "./components/PriceTimeline";
import RRGChart from "./components/RRGChart";
import {
  ANIMATION_INTERVAL_MS,
  DEFAULT_TAIL_LENGTH,
  MAX_TAIL_LENGTH,
  MIN_TAIL_LENGTH
} from "./config/constants";
import { useRRGData } from "./hooks/useRRGData";

export default function App() {
  const [resolution, setResolution] = useState("daily");
  const { data, loading, error } = useRRGData(resolution);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalMs, setIntervalMs] = useState(ANIMATION_INTERVAL_MS);
  const [zoomLevel, setZoomLevel] = useState(1.4);
  const [tailLength, setTailLength] = useState(DEFAULT_TAIL_LENGTH);

  const lastFrame = data ? data.dates.length - 1 : 0;
  const startFrame = useMemo(() => Math.max(0, lastFrame - tailLength * 5), [lastFrame, tailLength]);

  useEffect(() => {
    if (data) {
      setFrameIndex(lastFrame);
      setIsPlaying(false);
    }
  }, [data, lastFrame]);

  useEffect(() => {
    setTailLength((current) => Math.max(MIN_TAIL_LENGTH, Math.min(MAX_TAIL_LENGTH, current)));
  }, [resolution]);

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
        <AnimationControls
          currentDate={data.dates[frameIndex]}
          currentFrame={frameIndex}
          currentPrice={currentPrice}
          intervalMs={intervalMs}
          isPlaying={isPlaying}
          onFrequencyChange={(nextResolution) => {
            setIsPlaying(false);
            setResolution(nextResolution);
          }}
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
          onTailLengthChange={setTailLength}
          onZoomChange={setZoomLevel}
          resolution={resolution}
          tailLength={tailLength}
          totalFrames={data.dates.length}
          zoomLevel={zoomLevel}
        />

        <RRGChart data={data} frameIndex={frameIndex} tailLength={tailLength} zoomLevel={zoomLevel} />

        <PriceTimeline
          currentFrame={frameIndex}
          currentPrice={currentPrice}
          dates={data.dates}
          onFrameChange={(nextFrame) => {
            setIsPlaying(false);
            setFrameIndex(nextFrame);
          }}
          prices={data.benchmark.prices}
          tailLength={tailLength}
        />

        <Legend />
      </div>
    </div>
  );
}
