import { useState, useEffect, useContext } from "react";
import {
  select,
  extent,
  scaleLinear,
  axisLeft,
  axisBottom,
  area,
  line,
  curveLinear,
  easeLinear,
  easeElasticOut,
} from "d3";
import { blue, gray, offWhite, lightPurple, purple, red } from "../palette";
import { AppContext } from "../App";
import { blendColors } from "../util/math";
import { getPathLength } from "../util/dom";
import { useViewBox } from "../util/hooks";
import "./Frequency.css";

// unique id of this chart
const id = "frequency";

// dimensions of main chart area, in SVG units. use to set aspect ratio.
const width = 400;
const height = 200;

// duration of animations (in ms)
const duration = 1000;

// d3 code for chart
const chart = (frequency, changepoints, frequencyIndex) => {
  // get elements of interest
  const svg = select("#" + id);

  // get range of values for x/y axes
  const xExtent = extent(frequency, (d) => d.year);
  const yExtent = extent(frequency, (d) => d.frequency);

  // get scales for x/y that map values to SVG coordinates
  const xScale = scaleLinear().domain(xExtent).range([0, width]);
  const yScale = scaleLinear().domain(yExtent).range([0, -height]);

  // get scaled x/y coordinates
  frequency = frequency.map((d) => ({
    ...d,
    x: xScale(d.year),
    y: yScale(d.frequency),
  }));

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
    .attr("stroke-width", 2)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round");

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
  svg
    .select(".changepoints")
    .selectAll(".changepoints-text")
    .data(changepoints)
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
    .attr(
      "transform",
      ([from, to]) =>
        `translate(${(xScale(from) + xScale(to)) / 2}, ${
          -height / 2
        }) rotate(-90)`
    )
    .style("font-size", "12")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .attr("fill", purple)
    .text("Change point");

  // make dots from frequency points
  svg
    .select(".dots")
    .selectAll(".dot")
    .data(animatedFrequency)
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
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr(
      "data-tooltip",
      (d) => `Year: ${d.year}<br>Frequency: ${d.frequency.toExponential(2)}`
    );

  // make x/y axes ticks
  const xAxis = axisBottom(xScale)
    .ticks(frequency.length / 2)
    .tickFormat((d) => d);
  const yAxis = axisLeft(yScale)
    .tickValues(yExtent)
    .tickFormat((d, i) => (i === 0 ? "less" : "more"));
  svg.select(".x-axis").call(xAxis);
  svg.select(".y-axis").call(yAxis);
};

// visualization of frequency data
const Frequency = () => {
  const { search, results } = useContext(AppContext);
  const { frequency, changepoints } = results;
  const [frequencyIndex, setFrequencyIndex] = useState(0);
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
    chart(frequency, changepoints, frequencyIndex);
  }, [frequency, changepoints, frequencyIndex]);

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
          alignmentBaseline="middle"
          style={{ fontSize: 12 }}
        >
          Year
        </text>
        <text
          transform={`translate(-40, -${height / 2}) rotate(-90)`}
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
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          How often "{search}" has been used over time
        </text>
      </svg>
    </div>
  );
};

export default Frequency;
