import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

const HEIGHT = 168;
const MARGIN = { top: 24, right: 28, bottom: 36, left: 28 };
const POINT_SPACING = 26;

function useContainerWidth() {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(720);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return [containerRef, width];
}

function formatPrice(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}

export default function PriceTimeline({
  currentFrame,
  currentPrice,
  dates,
  onFrameChange,
  prices
}) {
  const scrollRef = useRef(null);
  const [containerRef, containerWidth] = useContainerWidth();
  const [isScrubbing, setIsScrubbing] = useState(false);

  const chartWidth = Math.max(
    containerWidth,
    MARGIN.left + MARGIN.right + Math.max(prices.length - 1, 1) * POINT_SPACING
  );

  const x = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, Math.max(prices.length - 1, 1)])
        .range([MARGIN.left, chartWidth - MARGIN.right]),
    [chartWidth, prices.length]
  );

  const y = useMemo(() => {
    const extent = d3.extent(prices);
    const min = extent[0] ?? 0;
    const max = extent[1] ?? 1;
    const padding = Math.max((max - min) * 0.18, max * 0.02, 1);

    return d3
      .scaleLinear()
      .domain([min - padding, max + padding])
      .range([HEIGHT - MARGIN.bottom, MARGIN.top]);
  }, [prices]);

  const linePath = useMemo(
    () =>
      d3
        .line()
        .x((_, index) => x(index))
        .y((value) => y(value))
        .curve(d3.curveMonotoneX)(prices) ?? "",
    [prices, x, y]
  );

  const areaPath = useMemo(
    () =>
      d3
        .area()
        .x((_, index) => x(index))
        .y0(HEIGHT - MARGIN.bottom)
        .y1((value) => y(value))
        .curve(d3.curveMonotoneX)(prices) ?? "",
    [prices, x, y]
  );

  const tickCount = Math.min(7, dates.length);
  const tickStep = Math.max(Math.floor(dates.length / Math.max(tickCount - 1, 1)), 1);
  const tickIndexes = useMemo(() => {
    const indexes = [];
    for (let index = 0; index < dates.length; index += tickStep) {
      indexes.push(index);
    }
    if (indexes[indexes.length - 1] !== dates.length - 1) {
      indexes.push(dates.length - 1);
    }
    return indexes;
  }, [dates.length, tickStep]);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport || isScrubbing) {
      return;
    }

    const targetCenter = x(currentFrame);
    const nextScrollLeft = Math.max(
      0,
      Math.min(targetCenter - viewport.clientWidth / 2, chartWidth - viewport.clientWidth)
    );

    viewport.scrollTo({
      left: nextScrollLeft,
      behavior: "smooth"
    });
  }, [chartWidth, currentFrame, isScrubbing, x]);

  function updateFrameFromPointer(clientX) {
    const viewport = scrollRef.current;
    if (!viewport) {
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const localX = clientX - rect.left + viewport.scrollLeft;
    const nextFrame = Math.round(x.invert(localX));
    const clampedFrame = Math.max(0, Math.min(prices.length - 1, nextFrame));
    onFrameChange(clampedFrame);
  }

  return (
    <section className="timeline-card">
      <div className="timeline-header">
        <div>
          <p className="timeline-eyebrow">SPY price timeline</p>
          <h2>Scroll the strip, drag anywhere, or let playback move the cursor.</h2>
        </div>
        <div className="timeline-readout">
          <span>{formatPrice(currentPrice)}</span>
          <span>{formatDate(dates[currentFrame])}</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="timeline-scroll"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setIsScrubbing(true);
          updateFrameFromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (isScrubbing) {
            updateFrameFromPointer(event.clientX);
          }
        }}
        onPointerUp={() => setIsScrubbing(false)}
        onPointerCancel={() => setIsScrubbing(false)}
      >
        <div ref={scrollRef} className="timeline-viewport">
          <svg
            viewBox={`0 0 ${chartWidth} ${HEIGHT}`}
            width={chartWidth}
            height={HEIGHT}
            role="img"
            aria-label="SPY price timeline"
          >
            <defs>
              <linearGradient id="timelineArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(120, 186, 255, 0.42)" />
                <stop offset="100%" stopColor="rgba(120, 186, 255, 0.02)" />
              </linearGradient>
            </defs>

            {tickIndexes.map((index) => (
              <g key={dates[index]}>
                <line
                  x1={x(index)}
                  x2={x(index)}
                  y1={MARGIN.top}
                  y2={HEIGHT - MARGIN.bottom}
                  stroke="rgba(226, 232, 255, 0.08)"
                  strokeDasharray="3 8"
                />
                <text
                  x={x(index)}
                  y={HEIGHT - 12}
                  fill="rgba(226, 232, 255, 0.62)"
                  fontSize="11"
                  textAnchor={index === 0 ? "start" : index === dates.length - 1 ? "end" : "middle"}
                >
                  {formatDate(dates[index])}
                </text>
              </g>
            ))}

            <path d={areaPath} fill="url(#timelineArea)" />
            <path
              d={linePath}
              fill="none"
              stroke="rgba(145, 203, 255, 0.95)"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            <line
              x1={x(currentFrame)}
              x2={x(currentFrame)}
              y1={12}
              y2={HEIGHT - MARGIN.bottom + 4}
              stroke="#ffd479"
              strokeWidth="2"
            />
            <circle
              cx={x(currentFrame)}
              cy={y(currentPrice)}
              r="6"
              fill="#ffd479"
              stroke="#101527"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
