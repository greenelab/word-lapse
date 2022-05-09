import { useContext, useState, useEffect } from "react";
import { useQueryParam } from "use-query-params";
import { find } from "lodash";
import Slider from "../components/Slider";
import Button from "../components/Button";
import { AppContext } from "../App";
import { id, lineHeight, tagSymbol, YearParam } from "./Neighbors";
import { blue, gray, lightGray, purple, red } from "../palette";
import { useViewBox } from "../util/hooks";
import { toHumanCase, wrapLines } from "../util/string";

// symbols for color blind, monochrome printing, etc
const props = {
  a: { symbol: "♥", color: red },
  b: { symbol: "♠", color: blue },
  both: { symbol: "♦", color: purple },
  neither: { symbol: "♣", color: lightGray },
};

// table visualization of neighbors, two years
const NeighborsCompare = ({ setCompare, playing, setPlaying }) => {
  // app state
  const { search, results } = useContext(AppContext);
  const { neighbors, uniqueNeighbors } = results;

  // other state
  const [symbols, setSymbols] = useState(false);
  const [svg, setViewBox] = useViewBox(20);

  // compute year stuff
  const years = Object.keys(neighbors);
  const [yearAIndex, setYearAIndex] = useQueryParam("yearA", YearParam(years));
  const [yearBIndex, setYearBIndex] = useQueryParam("yearB", YearParam(years));
  const yearA = years[yearAIndex] || "";
  const yearB = years[yearBIndex] || "";
  const aNeighbors = neighbors[yearA] || [];
  const bNeighbors = neighbors[yearB] || [];

  // animate year index
  useEffect(() => {
    let interval;
    if (playing)
      interval = window.setInterval(
        () => setYearBIndex((value) => (value + 1) % years.length, "replaceIn"),
        1000
      );
    return () => window.clearInterval(interval);
  }, [playing, years.length, setYearBIndex]);

  // fit svg viewbox after render when certain props change
  useEffect(() => {
    setViewBox();
  }, [symbols, uniqueNeighbors.length, setViewBox]);

  // if years not in url on mount, init to 0 and force url encode
  useEffect(() => {
    if (yearAIndex === undefined) setYearAIndex(0);
    if (yearBIndex === undefined) setYearBIndex(0);
  }, [yearAIndex, setYearAIndex, yearBIndex, setYearBIndex]);

  return (
    <div className="chart">
      <svg ref={svg} id={id}>
        {wrapLines(uniqueNeighbors, "word", 350, 10).map((line, lineIndex) => (
          <text
            key={lineIndex}
            x="0"
            y={lineHeight * lineIndex}
            textAnchor="middle"
          >
            {line.map((neighbor, index) => {
              // determine if neighbor in selected year(s)
              const inA = find(aNeighbors, neighbor);
              const inB = find(bNeighbors, neighbor);
              const inBoth = inA && inB;
              const inNeither = !inA && !inB;

              // determine props
              let color;
              let symbol;
              let tooltip;
              if (inBoth) {
                color = props.both.color;
                symbol = props.both.symbol;
                tooltip = `In ${yearA} and ${yearB}. ${
                  neighbor.tagged ? "Tagged" : "Not tagged"
                }.`;
              } else if (inA) {
                color = props.a.color;
                symbol = props.a.symbol;
                tooltip = `In ${yearA}. ${
                  neighbor.tagged ? "Tagged" : "Not tagged"
                }.`;
              } else if (inB) {
                color = props.b.color;
                symbol = props.b.symbol;
                tooltip = `In ${yearB}. ${
                  neighbor.tagged ? "Tagged" : "Not tagged"
                }.`;
              } else if (inNeither) {
                color = props.neither.color;
                symbol = props.neither.symbol;
              }

              return (
                <tspan
                  key={index}
                  dx="10"
                  style={{
                    fontSize: 10,
                    fill: color,
                  }}
                  data-tooltip={tooltip}
                  aria-hidden={inNeither}
                >
                  {symbols && symbol ? symbol + " " : ""}
                  {toHumanCase(neighbor.word)}
                  {neighbor.tagged && " " + tagSymbol}
                </tspan>
              );
            })}
          </text>
        ))}

        <text x="0" y="-35" textAnchor="middle" style={{ fontSize: 10 }}>
          <tspan>(or</tspan>{" "}
          <tspan fill={props.both.color}>
            {(symbols ? props.both.symbol + " " : "") + "both"}
          </tspan>{" "}
          <tspan>or</tspan>{" "}
          <tspan fill={gray}>
            {(symbols ? props.neither.symbol + " " : "") + "neither"}
          </tspan>
          <tspan>)</tspan>
        </text>

        <text
          x="0"
          y="-50"
          textAnchor="middle"
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          Words associated with "{search}" in{" "}
          <tspan fill={props.a.color}>
            {(symbols ? props.a.symbol + " " : "") + yearA}
          </tspan>{" "}
          <tspan>vs.</tspan>{" "}
          <tspan fill={props.b.color}>
            {(symbols ? props.b.symbol + " " : "") + yearB}
          </tspan>
        </text>
      </svg>

      <div className="chart-controls">
        <Button
          icon="right-long"
          onClick={() => setCompare(false)}
          data-tooltip="View single year"
        />

        <Button
          icon={symbols ? "font" : "icons"}
          onClick={() => setSymbols(!symbols)}
          data-tooltip={symbols ? "Show just text" : "Show symbols"}
        />

        <Button
          icon={playing ? "pause" : "play"}
          onClick={() => setPlaying(!playing)}
          data-tooltip={playing ? "Pause" : "Play"}
        />

        <Slider
          steps={years}
          value={yearAIndex}
          onChange={(value) => setYearAIndex(Number(value), "replaceIn")}
          tooltip={yearA}
          label={`Year A: ${yearA}`}
        />
        <span>vs.</span>
        <Slider
          steps={years}
          value={yearBIndex}
          onChange={(value) => {
            setYearBIndex(Number(value), "replaceIn");
            setPlaying(false);
          }}
          tooltip={yearB}
          label={`Year B: ${yearB}`}
        />
      </div>
    </div>
  );
};

export default NeighborsCompare;
