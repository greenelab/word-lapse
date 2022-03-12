import { useContext, useState, useEffect } from "react";
import { useQueryParam, withDefault } from "use-query-params";
import Slider from "../components/Slider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppContext } from "../App";
import { id, lineHeight, wrapLines, YearParam } from "./Neighbors";
import { blue, gray, lightGray, purple, red } from "../palette";
import { useViewBox } from "../util/hooks";
import { toHumanCase } from "../util/string";
import "./Neighbors.css";

// symbols for color blind, monochrome printing, etc
const compareProps = {
  a: { symbol: "♥", color: red },
  b: { symbol: "♠", color: blue },
  both: { symbol: "♦", color: purple },
  neither: { symbol: "♣", color: lightGray },
};

// compare two years neighbors list
const NeighborsCompare = ({ setCompare, playing, setPlaying }) => {
  // app state
  const { search, results } = useContext(AppContext);
  const { neighbors, uniqueNeighbors, tags } = results;

  // other state
  const [symbols, setSymbols] = useState(false);
  const [svg, setViewBox] = useViewBox(20);

  // compute year stuff
  const years = Object.keys(neighbors);
  const [yearAIndex, setYearAIndex] = useQueryParam(
    "yearA",
    withDefault(YearParam(years), 0)
  );
  const [yearBIndex, setYearBIndex] = useQueryParam(
    "yearB",
    withDefault(YearParam(years), 0)
  );
  const yearA = years[yearAIndex] || "";
  const yearB = years[yearBIndex] || "";
  const ANeighbors = neighbors[yearA] || [];
  const BNeighbors = neighbors[yearB] || [];

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

  return (
    <div className="chart">
      <svg ref={svg} id={id}>
        {wrapLines(uniqueNeighbors, symbols ? 60 : 70).map(
          (line, lineIndex) => (
            <text
              key={lineIndex}
              x="0"
              y={lineHeight * lineIndex}
              textAnchor="middle"
            >
              {line.map((word, index) => {
                // determine if word in selected year(s)
                const inA = ANeighbors.includes(word);
                const inB = BNeighbors.includes(word);
                const inBoth = inA && inB;
                const inNeither = !inA && !inB;

                // determine props
                let color;
                let symbol;
                let tooltip;
                if (inBoth) {
                  color = compareProps.both.color;
                  symbol = compareProps.both.symbol;
                  tooltip = `In ${yearA} and ${yearB}. ${
                    tags[word] ? "Tagged." : "Not tagged."
                  }`;
                } else if (inA) {
                  color = compareProps.a.color;
                  symbol = compareProps.a.symbol;
                  tooltip = `In ${yearA}. ${
                    tags[word] ? "Tagged." : "Not tagged."
                  }`;
                } else if (inB) {
                  color = compareProps.b.color;
                  symbol = compareProps.b.symbol;
                  tooltip = `In ${yearB}. ${
                    tags[word] ? "Tagged." : "Not tagged."
                  }`;
                } else if (inNeither) {
                  color = compareProps.neither.color;
                  symbol = compareProps.neither.symbol;
                }

                return (
                  <tspan
                    key={index}
                    className="neighbors-word"
                    dx="10"
                    style={{
                      fontSize: 10,
                      fill: color,
                    }}
                    data-tooltip={tooltip}
                    aria-hidden={inNeither}
                    tabIndex={inNeither ? -1 : 0}
                  >
                    {symbols && symbol ? symbol + " " : ""}
                    {toHumanCase(word)}
                    {tags[word] && "*"}
                  </tspan>
                );
              })}
            </text>
          )
        )}

        <text x="0" y="-50" textAnchor="middle" style={{ fontSize: 12 }}>
          Words associated with "{search}" in{" "}
          <tspan fill={compareProps.a.color}>
            {(symbols ? compareProps.a.symbol + " " : "") + yearA}
          </tspan>{" "}
          <tspan>vs.</tspan>{" "}
          <tspan fill={compareProps.b.color}>
            {(symbols ? compareProps.b.symbol + " " : "") + yearB}
          </tspan>
        </text>

        <text x="0" y="-30" textAnchor="middle" style={{ fontSize: 10 }}>
          <tspan>(or</tspan>{" "}
          <tspan fill={compareProps.both.color}>
            {(symbols ? compareProps.both.symbol + " " : "") + "both"}
          </tspan>{" "}
          <tspan>or</tspan>{" "}
          <tspan fill={gray}>
            {(symbols ? compareProps.neither.symbol + " " : "") + "neither"}
          </tspan>
          <tspan>)</tspan>
        </text>
      </svg>

      <div className="chart-controls">
        <button
          onClick={() => setCompare(false)}
          data-tooltip="View single year"
        >
          <FontAwesomeIcon icon="right-long" className="fa-fw" />
        </button>

        <button
          onClick={() => setSymbols(!symbols)}
          data-tooltip={symbols ? "Show just text" : "Show symbols"}
        >
          <FontAwesomeIcon
            icon={symbols ? "font" : "icons"}
            className="fa-fw"
          />
        </button>

        <button
          onClick={() => setPlaying(!playing)}
          data-tooltip={playing ? "Pause" : "Play"}
        >
          <FontAwesomeIcon
            icon={playing ? "pause" : "play"}
            className="fa-fw"
          />
        </button>

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
