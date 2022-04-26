import { useEffect, useContext } from "react";
import { select, extent, scaleLinear } from "d3";
import { useViewBox } from "../util/hooks";
import { AppContext } from "../App";
import { blue, darkGray, gray, red } from "../palette";
import { blendColors } from "../util/math";
import "./Umap.css";
import { elbow, shorten } from "../util/vector";

// unique id of this chart
const id = "umap";

// dimensions of main chart area, in SVG units. use to set aspect ratio.
const width = 420;
const height = 420;

// d3 code for chart
const chart = (umap) => {
  // get elements of interest
  const svg = select("#" + id);

  // get range of values for x/y axes
  const xExtent = extent([...umap.neighbors, ...umap.trajectory], (d) => d.x);
  const yExtent = extent([...umap.neighbors, ...umap.trajectory], (d) => d.y);

  // get scales for x/y that map values to SVG coordinates
  const xScale = scaleLinear().domain(xExtent).range([0, width]);
  const yScale = scaleLinear().domain(yExtent).range([0, -height]);

  // get scaled x/y coordinates
  umap.neighbors = umap.neighbors.map((point) => ({
    ...point,
    x: xScale(point.x),
    y: yScale(point.y),
  }));
  umap.trajectory = umap.trajectory.map((point) => ({
    ...point,
    x: xScale(point.x),
    y: yScale(point.y),
  }));

  // make neighbor labels from umap coordinates
  svg
    .select(".neighbor-labels")
    .selectAll(".neighbor-label")
    .data(umap.neighbors)
    .join((enter) => enter.append("text"))
    .attr("class", "neighbor-label")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .text((d) => d.token)
    .attr("fill", gray)
    .style("font-size", "8")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle");

  // make arrows from umap coordinates
  const arrows = [];
  for (let index = 0; index < umap.trajectory.length - 1; index++) {
    // make deep copies
    let a = { ...umap.trajectory[index] };
    let b = { ...umap.trajectory[index + 1] };
    // shorten segment in svg units
    const [shortA, shortB] = shorten(a, b, 10);
    a.x = shortA.x;
    a.y = shortA.y;
    b.x = shortB.x;
    b.y = shortB.y;
    // add arrow
    arrows.push([a, b]);
  }
  svg
    .select(".trajectory-arrows")
    .selectAll(".trajectory-arrow")
    .data(arrows)
    .join((enter) => enter.append("line"))
    .attr("class", "trajectory-arrow")
    .attr("x1", ([a, b]) => a.x)
    .attr("y1", ([a, b]) => a.y)
    .attr("x2", ([a, b]) => b.x)
    .attr("y2", ([a, b]) => b.y)
    .attr("fill", "none")
    .attr("stroke", darkGray)
    .attr("stroke-width", 2)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("marker-end", "url(#arrowhead)");

  // make trajectory dots from umap coordinates
  svg
    .select(".trajectory-dots")
    .selectAll(".trajectory-dot")
    .data(umap.trajectory)
    .join((enter) => enter.append("circle"))
    .attr("class", "trajectory-dot")
    .attr("r", 3)
    .attr("fill", (d, index, array) =>
      blendColors(red, blue, index / (array.length - 1))
    )
    .attr("stroke", "black")
    .attr("stroke-width", "1")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y);

  // make trajectory labels from umap coordinates
  const labels = [];
  for (let index = 0; index < umap.trajectory.length; index++) {
    // make deep copy
    let label = { ...umap.trajectory[index] };
    // jut out label at "elbow" to avoid overlap with arrows
    const { x, y } = elbow(
      umap.trajectory[index - 1],
      umap.trajectory[index],
      umap.trajectory[index + 1],
      20,
      15
    );
    label.x = x;
    label.y = y;
    // add label
    labels.push(label);
  }
  svg
    .select(".trajectory-labels")
    .selectAll(".trajectory-label")
    .data(labels)
    .join((enter) => enter.append("text"))
    .attr("class", "trajectory-label")
    .attr("fill", "black")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .text((d) => d.year)
    .style("font-size", "10")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle");
};

// umap visualization
const Umap = () => {
  const { search, results } = useContext(AppContext);
  const { umap } = results;
  const [svg, setViewBox] = useViewBox(20);

  // rerun d3 code any time data changes
  useEffect(() => {
    chart(umap);
  }, [umap]);

  // fit svg viewbox after render when certain props change
  useEffect(() => {
    setViewBox();
  }, [umap, setViewBox]);

  return (
    <div className="chart">
      <svg ref={svg} id={id}>
        <defs>
          <marker
            id="arrowhead"
            viewBox="-15 -10 15 20"
            markerWidth="10"
            markerHeight="10"
            refX="-3"
            orient="auto-start-reverse"
          >
            <path d="M -8 -4 L 0 0 L -8 4" fill={darkGray} />
          </marker>
        </defs>
        <g className="neighbor-labels"></g>
        <g className="trajectory-arrows"></g>
        <g className="trajectory-dots"></g>
        <g className="trajectory-labels"></g>
        <text
          x={width / 2}
          y={-height - 30}
          textAnchor="middle"
          style={{ fontSize: 12 }}
        >
          Trajectory of "{search}" over time
        </text>
      </svg>
    </div>
  );
};

export default Umap;
