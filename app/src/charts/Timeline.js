import { useState, useEffect, useContext } from "react";
import {
  select,
  extent,
  scaleLinear,
  axisLeft,
  axisBottom,
  area,
  line,
  curveCatmullRom,
  easeLinear,
  easeElasticOut,
} from "d3";
import { blue, gray, lightGray, lightPurple, purple, red } from "../palette";
import { AppContext } from "../App";
import { blendColors } from "../util/math";
import { getPathLength } from "../util/dom";
import { useViewBox } from "../util/hooks";
import "./Timeline.css";

// unique id of this chart
const id = "timeline";

// dimensions of main chart area, in SVG units. use to set aspect ratio.
const width = 400;
const height = 200;

// duration of animations (in ms)
const duration = 1000;

// d3 code for chart
const chart = (timeline, changepoints, timelineIndex) => {
  // get elements of interest
  const svg = select("#" + id);

  // get subset of timeline for animation purposes
  const animatedTimeline = timeline.slice(0, timelineIndex);

  // get range of values for x/y axes
  const xExtent = extent(timeline, (d) => d.year);
  const yExtent = extent(timeline, (d) => d.frequency);

  // get scales for x/y that map values to SVG coordinates
  const xScale = scaleLinear().domain(xExtent).range([0, width]);
  const yScale = scaleLinear().domain(yExtent).range([0, -height]);

  // make curve fill from timeline points
  const curveFill = area()
    .curve(curveCatmullRom)
    .x((d) => xScale(d.year))
    .y1((d) => yScale(d.frequency))
    .y0(() => yScale(yExtent[0]));
  svg
    .select(".curve-fills")
    .selectAll(".curve-fill")
    .data([timeline])
    .join("path")
    .attr("class", "curve-fill")
    .attr("d", curveFill)
    .attr("fill", lightGray);

  // make curve stroke from timeline points
  const curveStroke = line()
    .curve(curveCatmullRom)
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.frequency));
  const length = getPathLength(curveStroke(timeline));
  svg
    .select(".curve-strokes")
    .selectAll(".curve-stroke")
    .data([timeline])
    .join((enter) =>
      enter
        .append("path")
        .attr("stroke-dasharray", length + " " + length)
        .attr("stroke-dashoffset", length)
        .transition()
        .delay(duration)
        .duration(duration)
        .ease(easeLinear)
        .attr("stroke-dashoffset", 0)
    )
    .attr("class", "curve-stroke")
    .attr("d", curveStroke)
    .attr("fill", "none")
    .attr("stroke", gray)
    .attr("stroke-width", 2);

  // make changepoints fill
  const changepointFill = area()
    .curve(curveCatmullRom)
    .x((d) => xScale(d))
    .y1(() => yScale(yExtent[1]))
    .y0(() => yScale(yExtent[0]));
  svg
    .select(".changepoints")
    .selectAll(".changepoints-fill")
    .data([changepoints])
    .join((enter) =>
      enter
        .append("path")
        .style("opacity", 0)
        .transition()
        .delay(duration * 2)
        .duration(duration)
        .style("opacity", 0.25)
    )
    .attr("class", "changepoints-fill")
    .attr("d", changepointFill)
    .attr("fill", lightPurple)
    .attr("stroke", purple)
    .attr("stroke-dasharray", "4 4")
    .attr(
      "data-tooltip",
      (d) =>
        `${d.join(
          " to "
        )} represents a significant change in the word's association`
    );

  // make changepoints text
  const midX = (xScale(changepoints[0]) + xScale(changepoints[1])) / 2;
  svg
    .select(".changepoints")
    .selectAll(".changepoints-text")
    .data([changepoints[0]])
    .join((enter) =>
      enter
        .append("text")
        .style("opacity", 0)
        .transition()
        .delay(duration * 2)
        .duration(duration)
        .style("opacity", 1)
    )
    .attr("class", "changepoints-text")
    .attr("transform", () => `translate(${midX}, ${-height / 2}) rotate(-90)`)
    .style("font-size", "12")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .attr("fill", purple)
    .text("Change point");

  // make dots from timeline points
  svg
    .select(".dots")
    .selectAll(".dot")
    .data(animatedTimeline)
    .join((enter) =>
      enter
        .append("circle")
        .attr("r", 0)
        .transition()
        .duration(duration)
        .ease(easeElasticOut)
        .attr("r", 3)
    )
    .attr("class", "dot")
    .attr("fill", (d, index, array) =>
      blendColors(red, blue, index / (array.length - 1))
    )
    .attr("stroke", "black")
    .attr("stroke-width", "1")
    .attr("cx", (d) => xScale(d.year))
    .attr("cy", (d) => yScale(d.frequency))
    .attr(
      "data-tooltip",
      (d) => `Year: ${d.year}<br>Frequency: ${d.frequency.toExponential(2)}`
    );

  // make x/y axes ticks
  const xAxis = axisBottom(xScale)
    .ticks(timeline.length / 2)
    .tickFormat((d) => d);
  const yAxis = axisLeft(yScale)
    .tickValues(yExtent)
    .tickFormat((d, i) => (i === 0 ? "less" : "more"));
  svg.select(".x-axis").call(xAxis);
  svg.select(".y-axis").call(yAxis);
};

// frequency timeline chart
const Timeline = () => {
  const { search, results } = useContext(AppContext);
  const { timeline, changepoints } = results;
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [svg, setViewBox] = useViewBox(20);

  // animate timeline timelineIndex
  useEffect(() => {
    if (timelineIndex < timeline.length) {
      setTimelineIndex(timelineIndex);
      window.setTimeout(
        () => setTimelineIndex((value) => value + 1),
        duration / timeline.length
      );
    }
  }, [timelineIndex, timeline.length]);

  // rerun d3 code any time data changes
  useEffect(() => {
    chart(timeline, changepoints, timelineIndex);
  }, [timeline, changepoints, timelineIndex]);

  // fit svg viewbox after render when timeline changes
  useEffect(() => {
    setViewBox();
  }, [timeline.length, setViewBox]);

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
          alignmentBaseline="middle"
          style={{ fontSize: 12 }}
        >
          Year
        </text>
        <text
          transform={`translate(-50, -${height / 2}) rotate(-90)`}
          textAnchor="middle"
          alignmentBaseline="middle"
          style={{ fontSize: 12 }}
        >
          Frequency
        </text>
        <text
          x={width / 2}
          y={-height - 30}
          textAnchor="middle"
          style={{ fontSize: 12 }}
        >
          How often "{search}" has been used over time
        </text>
      </svg>
    </div>
  );
};

export default Timeline;
