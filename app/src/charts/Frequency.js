import { useState, useEffect, useContext } from "react";
import {
  select,
  extent,
  scaleLinear,
  scaleLog,
  axisLeft,
  axisBottom,
  area,
  line,
  curveLinear,
  easeLinear,
  easeBackOut,
} from "d3";
import { blue, gray, offWhite, lightPurple, purple, red } from "../palette";
import { AppContext } from "../App";
import { blendColors } from "../util/math";
import { getPathLength } from "../util/dom";
import { useViewBox } from "../util/hooks";
import Button from "../components/Button";
import "./Frequency.css";
import { ReactComponent as ScaleLinear } from "../assets/scale-linear.svg";
import { ReactComponent as ScaleLog } from "../assets/scale-log.svg";
import { compactNumber, logLabel } from "../util/string";

// unique id of this chart
const id = "frequency";

// dimensions of main chart area, in SVG units. use to set aspect ratio.
const width = 380;
const height = 200;

// duration of animations (in ms)
const duration = 1000;

// d3 code for chart
const chart = (frequency, changepoints, normalized, linear, frequencyIndex) => {
  // get elements of interest
  const svg = select("#" + id);

  // get range of values for x/y axes
  const xExtent = extent(frequency, (d) => d.year);
  const yExtent = extent(frequency, (d) =>
    normalized ? d.normalized : d.frequency
  );

  // get scales for x/y that map values to SVG coordinates
  const scale = linear ? scaleLinear : scaleLog;
  const xScale = scale().domain(xExtent).range([0, width]);
  const yScale = scale().domain(yExtent).range([0, -height]);

  frequency
    // get scaled x/y coordinates
    ?.forEach((d) => {
      d.x = xScale(d.year);
      d.y = yScale(normalized ? d.normalized : d.frequency);
    });

  // get subset of frequency for animation purposes
  const animatedFrequency = frequency.slice(0, frequencyIndex);

  // make curve fill from frequency points
  const curveFill = area()
    .curve(curveLinear)
    .x((d) => d.x)
    .y1((d) => d.y)
    .y0(() => yScale(yExtent[0]));
  svg
    .select(".curve-fills")
    .selectAll(".curve-fill")
    .data([frequency])
    .join("path")
    .attr("class", "curve-fill")
    .attr("d", curveFill)
    .attr("fill", offWhite);

  // make curve stroke from frequency points
  const curveStroke = line()
    .curve(curveLinear)
    .x((d) => d.x)
    .y((d) => d.y);
  const length = getPathLength(curveStroke(frequency));
  svg
    .select(".curve-strokes")
    .selectAll(".curve-stroke")
    .data([frequency])
    .join("path")
    .attr("class", "curve-stroke")
    .attr("d", curveStroke)
    .attr("fill", "none")
    .attr("stroke", gray)
    .attr("stroke-width", 2)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-dasharray", length + " " + length)
    .attr("stroke-dashoffset", length)
    .interrupt()
    .transition()
    .delay(duration / 2)
    .duration(duration)
    .ease(easeLinear)
    .attr("stroke-dashoffset", 0);

  // make changepoints fill
  const changepointFill = area()
    .curve(curveLinear)
    .x((d) => xScale(d))
    .y1(() => yScale(yExtent[1]))
    .y0(() => yScale(yExtent[0]));
  svg
    .select(".changepoints")
    .selectAll(".changepoints-fill")
    .data(changepoints)
    .join("path")
    .attr("class", "changepoints-fill")
    .attr("d", changepointFill)
    .attr("fill", lightPurple)
    .attr("stroke", purple)
    .attr("stroke-dasharray", "4 4")
    .style("opacity", 0.5)
    .attr(
      "data-tooltip",
      (d) =>
        d.join(" to ") +
        " represents a significant change in the word's association"
    );

  // make changepoints text
  svg
    .select(".changepoints")
    .selectAll(".changepoints-text")
    .data(changepoints)
    .join("text")
    .attr("class", "changepoints-text")
    .attr(
      "transform",
      ([from, to]) =>
        `translate(${(xScale(from) + xScale(to)) / 2}, ${-height / 2})` +
        `rotate(-90)`
    )
    .style("font-size", "12px")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", purple)
    .text("Change point");

  // make dots from frequency points
  svg
    .select(".dots")
    .selectAll(".dot")
    .data(animatedFrequency)
    .join("circle")
    .attr("class", "dot")
    .attr("fill", (d, index, array) =>
      blendColors(red, blue, index / (array.length - 1))
    )
    .attr("stroke", "black")
    .attr("stroke-width", "1")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 0)
    .interrupt()
    .transition()
    .delay((d, index, array) => (duration * index) / array.length)
    .duration(duration / 2)
    .ease(easeBackOut)
    .attr("r", 3)
    .attr("data-tooltip", (d) =>
      [
        `Year: ${d.year}`,
        `Frequency: ${d.frequency.toLocaleString()}`,
        `Normalized Frequency: ${compactNumber(d.normalized)}`,
      ].join("<br/>")
    );

  // make x/y axes ticks
  const xAxis = axisBottom(xScale)
    .ticks(frequency.length / 2)
    .tickFormat((d) => d);
  const yAxis = axisLeft(yScale).tickFormat(
    linear ? compactNumber : logLabel([1, 2, 5], compactNumber)
  );

  svg
    .select(".x-axis")
    .interrupt()
    .transition()
    .duration(linear ? 100 : 0)
    .call(xAxis)
    .style("font-size", "10px");
  svg
    .select(".y-axis")
    .interrupt()
    .transition()
    .duration(linear ? 100 : 0)
    .call(yAxis)
    .style("font-size", "8px");
};

// visualization of frequency data
const Frequency = () => {
  // app state
  const { search, results } = useContext(AppContext);
  const { frequency, changepoints } = results;

  // other state
  const [frequencyIndex, setFrequencyIndex] = useState(0);
  const [normalized, setNormalized] = useState(false);
  const [linear, setLinear] = useState(true);
  const [svg, setViewBox] = useViewBox(20);

  // animate frequencyIndex
  useEffect(() => {
    let timeout;
    if (frequencyIndex < frequency.length) {
      setFrequencyIndex(frequencyIndex);
      timeout = window.setTimeout(
        () => setFrequencyIndex((value) => value + 1),
        duration / frequency.length
      );
    }
    return () => window.clearTimeout(timeout);
  }, [frequencyIndex, frequency.length]);

  // rerun d3 code any time data changes
  useEffect(() => {
    chart(frequency, changepoints, normalized, linear, frequencyIndex);
  }, [frequency, changepoints, normalized, linear, frequencyIndex]);

  // fit svg viewbox after render when certain props change
  useEffect(() => {
    setViewBox();
  }, [frequency.length, setViewBox]);

  return (
    <div className="chart">
      <svg ref={svg} id={id}>
        <g className="curve-fills"></g>
        <g className="curve-strokes"></g>
        <g className="changepoints"></g>
        <g className="x-axis"></g>
        <g className="y-axis"></g>
        <g className="dots"></g>
        <text
          transform={`translate(${width / 2}, 40)`}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: "12px" }}
        >
          Year
        </text>
        <text
          transform={`translate(-50, -${height / 2}) rotate(-90)`}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: "12px" }}
        >
          {normalized ? "Normalized" : "Absolute"} Frequency
        </text>
        <text
          x={width / 2}
          y={-height - 30}
          textAnchor="middle"
          style={{ fontSize: "12px", fontWeight: 600 }}
        >
          How often "{search}" has been used over time
        </text>
      </svg>

      <div className="chart-controls">
        <Button
          icon={normalized ? "percent" : "hashtag"}
          text={normalized ? "Normalized" : "Absolute"}
          onClick={() => setNormalized(!normalized)}
          data-tooltip={
            normalized
              ? "View absolute frequencies"
              : "View normalized frequencies"
          }
        />
        <Button
          CustomIcon={linear ? ScaleLinear : ScaleLog}
          text={linear ? "Linear" : "Log"}
          onClick={() => setLinear(!linear)}
          data-tooltip={linear ? "Show log scale" : "Show linear scale"}
        />
      </div>
    </div>
  );
};

export default Frequency;
