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
import { blue, gray, lightGray, red } from "../palette";
import { AppContext } from "../App";
import { blendColors } from "../util/math";
import { getPathLength } from "../util/dom";

// unique id of this chart
const id = "#timeline";
// dimensions of main chart area, in SVG units. use to set aspect ratio.
const width = 400;
const height = 200;
// duration of animations (in ms)
const duration = 1000;

const chart = (data, index) => {
  // get elements of interest
  const svg = select(id);
  const body = svg.select(".body");

  // get subset of data for animation purposes
  const animatedData = data.slice(0, index);

  // get range of values for x/y axes
  const xExtent = extent(data, (d) => d.year);
  const yExtent = extent(data, (d) => d.frequency);

  // get scales for x/y that map values to SVG coordinates
  const xScale = scaleLinear().domain(xExtent).range([0, width]);
  const yScale = scaleLinear().domain(yExtent).range([0, -height]);

  // curve factories
  const curveFill = area()
    .curve(curveCatmullRom)
    .x((d) => xScale(d.year))
    .y1((d) => yScale(d.frequency))
    .y0((d) => yScale(yExtent[0]));
  const curveStroke = line()
    .curve(curveCatmullRom)
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.frequency));

  // get total length of path for animation
  const length = getPathLength(curveStroke(data));

  // make curve fill from data points
  body
    .selectAll(".curve-fill")
    .data([data])
    .join("path")
    .attr("class", "curve-fill")
    .attr("d", curveFill)
    .attr("fill", lightGray);

  // make curve stroke from data points
  body
    .selectAll(".curve-stroke")
    .data([data])
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

  // make dots from data points
  body
    .selectAll(".dot")
    .data(animatedData)
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
    .attr("cy", (d) => yScale(d.frequency));

  // make x/y axes ticks
  const xAxis = axisBottom(xScale)
    .ticks(data.length / 2)
    .tickFormat((d) => d);
  const yAxis = axisLeft(yScale)
    .tickValues(yExtent)
    .tickFormat((d, i) => (i === 0 ? "less" : "more"));
  select(id + " .x-axis").call(xAxis);
  select(id + " .y-axis").call(yAxis);
};

// frequency timeline chart
const Timeline = () => {
  const { search, results } = useContext(AppContext);
  const { frequency_timeline: data } = results;
  const [index, setIndex] = useState(0);

  // animate data index
  useEffect(() => {
    if (index < data.length) {
      setIndex(index);
      window.setTimeout(
        () => setIndex((value) => value + 1),
        duration / data.length
      );
    }
  }, [index, data.length]);

  // rerun d3 code any time data changes
  useEffect(() => {
    chart(data, index);
  }, [data, index]);

  return (
    <>
      <g className="body"></g>
      <g className="axis x-axis"></g>
      <g className="axis y-axis"></g>
      <text
        className="axis-title"
        transform={`translate(${width / 2}, 40)`}
        textAnchor="middle"
        alignmentBaseline="middle"
        style={{ fontSize: 12 }}
      >
        Year
      </text>
      <text
        className="axis-title"
        transform={`translate(-50, -${height / 2}) rotate(-90)`}
        textAnchor="middle"
        alignmentBaseline="middle"
        style={{ fontSize: 12 }}
      >
        Frequency
      </text>
      <text
        className="title"
        x={width / 2}
        y={-height - 30}
        textAnchor="middle"
        style={{ fontSize: 16 }}
      >
        How often "{search}" has been used over time
      </text>
    </>
  );
};

export default Timeline;
