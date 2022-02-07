import { useContext, useState, useEffect } from "react";
import { select, forceCollide, forceLink, forceSimulation } from "d3";
import { AppContext } from "../App";
import { blue, lightGray, lightPurple, red } from "../palette";
import { toHumanCase } from "../util/string";

// unique id of this chart
const id = "neighbors";

// dimensions of viewbox
const width = 800;
const height = 800;

// geometry settings
const nodeSize = 100;
const nodeDistance = 140;
const linkDistance = 120;

// singleton mutable objects for d3 force simulation to work with
let nodes = [];
let links = [];

const update = (neighbors, search) => {
  // mutate nodes and links objects from neighbor data
  links = neighbors.map((word) => ({ source: search, target: word }));
  const centerProps = { center: true, fx: 0, fy: 0 };
  for (const neighbor of [search, ...neighbors])
    if (!nodes.find((node) => node.id === neighbor))
      nodes.push({ id: neighbor, ...(neighbor === search ? centerProps : {}) });
  for (let i = 0; i < nodes.length; i++)
    if (![search, ...neighbors].includes(nodes[i].id)) nodes.splice(i--, 1);

  // sort to keep in order
  nodes.sort((a, b) => a.id - b.id);
  // tell simulation nodes and links have changed
  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.alpha(1).restart();
};

const chart = () => {
  // get elements of interest
  const svg = select("#" + id);

  // console.log(links[0]);

  // make edges from neighbor points
  svg
    .select(".links")
    .selectAll(".link")
    .data(links)
    .join("line")
    .attr("class", "link")
    .attr("stroke", lightGray)
    .attr("stroke-width", 2)
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);

  // make node fills from neighbors points
  svg
    .select(".nodes")
    .selectAll(".node-fill")
    .data(nodes)
    .join("rect")
    .attr("class", "node-fill")
    .attr("fill", (d) => (d.center ? lightPurple : blue))
    .attr("rx", nodeSize / 4)
    .attr("ry", nodeSize / 4)
    .attr("x", (d) => d.x - nodeSize / 2)
    .attr("y", (d) => d.y - nodeSize / 4)
    .attr("width", nodeSize)
    .attr("height", nodeSize / 2);

  // make node fills from neighbors points
  svg
    .select(".nodes")
    .selectAll(".node-text")
    .data(nodes)
    .join("text")
    .attr("class", "node-text")
    .attr("fill", "black")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .text((d) => toHumanCase(d.id))
    .style("font-size", (d) => (d.center ? 16 : 12));
};

const simulation = forceSimulation()
  .force("collide", forceCollide().radius(nodeDistance / 2))
  .force(
    "link",
    forceLink()
      .distance(linkDistance)
      .id((d) => d.id)
  )
  .on("tick", chart)
  .alphaMin(0.1);

// word neighbors network
const Neighbors = () => {
  const { search, results } = useContext(AppContext);
  const years = Object.keys(results.neighbors);
  const [index, setIndex] = useState(0);
  const year = years[index];
  const neighbors = results.neighbors[year];

  // animate year index
  useEffect(() => {
    const interval = window.setInterval(
      () => setIndex((value) => (value + 1) % years.length),
      3000
    );

    return () => window.clearInterval(interval);
  }, [years.length]);

  // rerun d3 code any time data changes
  useEffect(() => {
    update(neighbors, search);
  }, [neighbors, search]);

  return (
    <svg id={id} viewBox={`-${width / 2} -${height / 2} ${width} ${height}`}>
      <g className="links"></g>
      <g className="nodes"></g>
    </svg>
  );
};

export default Neighbors;
