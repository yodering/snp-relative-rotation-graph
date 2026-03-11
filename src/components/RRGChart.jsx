import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { SECTORS, TAIL_LENGTH } from "../config/constants";

const HEIGHT = 600;
const MARGIN = { top: 40, right: 80, bottom: 60, left: 60 };

function useContainerWidth() {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(960);

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

export default function RRGChart({ data, frameIndex }) {
  const svgRef = useRef(null);
  const [containerRef, width] = useContainerWidth();

  const domain = useMemo(() => {
    const ratios = [];
    const momentums = [];

    SECTORS.forEach(({ ticker }) => {
      ratios.push(...data.sectors[ticker].ratio);
      momentums.push(...data.sectors[ticker].momentum);
    });

    const xExtent = d3.extent(ratios);
    const yExtent = d3.extent(momentums);
    const pad = 0.75;

    return {
      x: [Math.min(xExtent[0] - pad, 100 - pad), Math.max(xExtent[1] + pad, 100 + pad)],
      y: [Math.min(yExtent[0] - pad, 100 - pad), Math.max(yExtent[1] + pad, 100 + pad)]
    };
  }, [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const chartWidth = Math.max(width, 320);
    const innerWidth = chartWidth - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const x = d3.scaleLinear().domain(domain.x).range([MARGIN.left, MARGIN.left + innerWidth]);
    const y = d3.scaleLinear().domain(domain.y).range([MARGIN.top + innerHeight, MARGIN.top]);

    svg.attr("viewBox", `0 0 ${chartWidth} ${HEIGHT}`).attr("width", "100%").attr("height", HEIGHT);

    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", chartWidth)
      .attr("height", HEIGHT)
      .attr("rx", 20)
      .attr("fill", "#1a1a2e");

    const plot = svg.append("g");
    const centerX = x(100);
    const centerY = y(100);
    const plotRight = MARGIN.left + innerWidth;
    const plotBottom = MARGIN.top + innerHeight;

    plot
      .append("rect")
      .attr("x", centerX)
      .attr("y", MARGIN.top)
      .attr("width", plotRight - centerX)
      .attr("height", centerY - MARGIN.top)
      .attr("fill", "rgba(0, 200, 0, 0.08)");
    plot
      .append("rect")
      .attr("x", centerX)
      .attr("y", centerY)
      .attr("width", plotRight - centerX)
      .attr("height", plotBottom - centerY)
      .attr("fill", "rgba(255, 200, 0, 0.08)");
    plot
      .append("rect")
      .attr("x", MARGIN.left)
      .attr("y", centerY)
      .attr("width", centerX - MARGIN.left)
      .attr("height", plotBottom - centerY)
      .attr("fill", "rgba(200, 0, 0, 0.08)");
    plot
      .append("rect")
      .attr("x", MARGIN.left)
      .attr("y", MARGIN.top)
      .attr("width", centerX - MARGIN.left)
      .attr("height", centerY - MARGIN.top)
      .attr("fill", "rgba(0, 100, 255, 0.08)");

    const gridX = d3.axisBottom(x).ticks(8).tickSize(-innerHeight).tickFormat(() => "");
    const gridY = d3.axisLeft(y).ticks(8).tickSize(-innerWidth).tickFormat(() => "");

    plot
      .append("g")
      .attr("transform", `translate(0, ${plotBottom})`)
      .call(gridX)
      .call((group) => group.selectAll("line").attr("stroke", "rgba(255,255,255,0.08)"))
      .call((group) => group.select(".domain").remove());

    plot
      .append("g")
      .attr("transform", `translate(${MARGIN.left}, 0)`)
      .call(gridY)
      .call((group) => group.selectAll("line").attr("stroke", "rgba(255,255,255,0.08)"))
      .call((group) => group.select(".domain").remove());

    plot
      .append("line")
      .attr("x1", centerX)
      .attr("x2", centerX)
      .attr("y1", MARGIN.top)
      .attr("y2", plotBottom)
      .attr("stroke", "rgba(255,255,255,0.45)")
      .attr("stroke-dasharray", "6 6");

    plot
      .append("line")
      .attr("x1", MARGIN.left)
      .attr("x2", plotRight)
      .attr("y1", centerY)
      .attr("y2", centerY)
      .attr("stroke", "rgba(255,255,255,0.45)")
      .attr("stroke-dasharray", "6 6");

    plot
      .append("g")
      .attr("transform", `translate(0, ${plotBottom})`)
      .call(d3.axisBottom(x).ticks(8))
      .call((group) => group.selectAll("text").attr("fill", "rgba(255,255,255,0.75)"))
      .call((group) => group.selectAll("line").attr("stroke", "rgba(255,255,255,0.35)"))
      .call((group) => group.select(".domain").attr("stroke", "rgba(255,255,255,0.35)"));

    plot
      .append("g")
      .attr("transform", `translate(${MARGIN.left}, 0)`)
      .call(d3.axisLeft(y).ticks(8))
      .call((group) => group.selectAll("text").attr("fill", "rgba(255,255,255,0.75)"))
      .call((group) => group.selectAll("line").attr("stroke", "rgba(255,255,255,0.35)"))
      .call((group) => group.select(".domain").attr("stroke", "rgba(255,255,255,0.35)"));

    svg
      .append("text")
      .attr("x", chartWidth / 2)
      .attr("y", HEIGHT - 14)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.8)")
      .text("JdK RS-Ratio ->");

    svg
      .append("text")
      .attr("transform", `translate(18, ${HEIGHT / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.8)")
      .text("JdK RS-Momentum ->");

    [
      { text: "Leading", x: plotRight - 12, y: MARGIN.top + 20, anchor: "end" },
      { text: "Weakening", x: plotRight - 12, y: plotBottom - 12, anchor: "end" },
      { text: "Lagging", x: MARGIN.left + 12, y: plotBottom - 12, anchor: "start" },
      { text: "Improving", x: MARGIN.left + 12, y: MARGIN.top + 20, anchor: "start" }
    ].forEach((label) => {
      svg
        .append("text")
        .attr("x", label.x)
        .attr("y", label.y)
        .attr("text-anchor", label.anchor)
        .attr("fill", "rgba(255,255,255,0.45)")
        .attr("font-size", 14)
        .attr("font-weight", 700)
        .text(label.text);
    });

    SECTORS.forEach(({ color, ticker }) => {
      const ratio = data.sectors[ticker].ratio;
      const momentum = data.sectors[ticker].momentum;
      const tailStart = Math.max(0, frameIndex - TAIL_LENGTH);
      const tailPoints = d3.range(tailStart, frameIndex + 1).map((index) => [x(ratio[index]), y(momentum[index])]);

      plot
        .append("path")
        .datum(tailPoints)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("stroke-opacity", 0.65)
        .attr("d", d3.line()(tailPoints));

      tailPoints.slice(0, -1).forEach((point, index) => {
        plot
          .append("circle")
          .attr("cx", point[0])
          .attr("cy", point[1])
          .attr("r", 2 + (index / Math.max(tailPoints.length - 1, 1)) * 1.5)
          .attr("fill", color)
          .attr("opacity", 0.25 + (index / Math.max(tailPoints.length - 1, 1)) * 0.35);
      });

      const currentX = x(ratio[frameIndex]);
      const currentY = y(momentum[frameIndex]);

      plot
        .append("circle")
        .attr("cx", currentX)
        .attr("cy", currentY)
        .attr("r", 6)
        .attr("fill", color)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.5);

      plot
        .append("text")
        .attr("x", currentX + 10)
        .attr("y", currentY - 10)
        .attr("fill", "#ffffff")
        .attr("font-size", 12)
        .attr("font-weight", 700)
        .text(ticker);
    });
  }, [data, domain, frameIndex, width]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "22px",
        overflow: "hidden"
      }}
    >
      <svg ref={svgRef} role="img" aria-label="Relative Rotation Graph" />
    </div>
  );
}