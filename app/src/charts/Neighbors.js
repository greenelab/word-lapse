import { useContext, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppContext } from "../App";
import Slider from "../components/Slider";
import { blue, gray, lightGray, purple, red } from "../palette";
import { useViewBox } from "../util/hooks";
import { blendColors } from "../util/math";
import { toHumanCase } from "../util/string";
import { count } from "../util/neighbors";
import "./Neighbors.css";

// unique id of this chart
const id = "neighbors";

// max char width of lines
const chars = 56; // adjust so that fitted title text size matches that of other graphs
// height of lines
const height = 15;

// symbols for color blind, monochrome printing, etc
const compareProps = {
  a: { symbol: "♥", color: red },
  b: { symbol: "♠", color: blue },
  both: { symbol: "♦", color: purple },
  neither: { symbol: "♣", color: lightGray },
};

// neighbors list
const Neighbors = () => {
  // app state
  const { search, results } = useContext(AppContext);
  const { neighbors, uniqueNeighbors } = results;

  // compute year stuff
  const years = Object.keys(neighbors);
  const [yearAIndex, setYearAIndex] = useState(0);
  const [yearBIndex, setYearBIndex] = useState(0);
  const yearA = years[yearAIndex];
  const yearB = years[yearBIndex];
  const ANeighbors = neighbors[yearA];
  const BNeighbors = neighbors[yearB];

  // other state
  const [playing, setPlaying] = useState(true);
  const [compare, setCompare] = useState(false);
  const [symbols, setSymbols] = useState(false);
  const [svg, setViewBox] = useViewBox(40);

  // animate year index
  useEffect(() => {
    let interval;
    if (playing)
      interval = window.setInterval(
        () => setYearBIndex((value) => (value + 1) % years.length),
        1000
      );
    return () => window.clearInterval(interval);
  }, [playing, years.length]);

  // reset year indices when results change
  useEffect(() => {
    setYearAIndex(0);
    setYearBIndex(0);
  }, [uniqueNeighbors]);

  // fit svg viewbox after render when certain props change
  useEffect(() => {
    setViewBox();
  }, [compare, symbols, uniqueNeighbors.length, setViewBox]);

  // current year color
  const blended = blendColors(red, blue, yearBIndex / (years.length - 1));

  // wrap text into lines by number of characters
  // (because there is no easier way, believe me i tried)
  const lines = [[]];
  for (const word of uniqueNeighbors) {
    if (
      lines[lines.length - 1].reduce((total, word) => total + word.length, 0) >
      chars
    )
      lines.push([]);
    lines[lines.length - 1].push(word);
  }

  return (
    <div className="chart">
      <svg ref={svg} id={id}>
        {lines.map((line, lineIndex) => (
          <text
            key={lineIndex}
            x="0"
            y={height * lineIndex}
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

              if (compare) {
                if (inBoth) {
                  color = compareProps.both.color;
                  symbol = compareProps.both.symbol;
                  tooltip = `In ${yearA} and ${yearB}`;
                } else if (inA) {
                  color = compareProps.a.color;
                  symbol = compareProps.a.symbol;
                  tooltip = `In ${yearA}`;
                } else if (inB) {
                  color = compareProps.b.color;
                  symbol = compareProps.b.symbol;
                  tooltip = `In ${yearB}`;
                } else {
                  color = compareProps.neither.color;
                  symbol = compareProps.neither.symbol;
                }
              } else {
                color = inB ? blended : lightGray;
                tooltip = `In ${count(word, neighbors)} of the year(s)`;
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
                  {(symbols && symbol ? symbol + " " : "") + toHumanCase(word)}
                </tspan>
              );
            })}
          </text>
        ))}

        <text
          x="0"
          y={compare ? -50 : -30}
          textAnchor="middle"
          style={{ fontSize: 12 }}
        >
          Words associated with "{search}" in{" "}
          {compare && (
            <>
              <tspan fill={compareProps.a.color}>
                {(symbols ? compareProps.a.symbol + " " : "") + yearA}
              </tspan>{" "}
              <tspan>vs.</tspan>{" "}
              <tspan fill={compareProps.b.color}>
                {(symbols ? compareProps.b.symbol + " " : "") + yearB}
              </tspan>
            </>
          )}
          {!compare && yearB}
        </text>

        {compare && (
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
        )}
      </svg>

      <div className="chart-controls">
        <button
          onClick={() => setCompare(!compare)}
          data-tooltip={compare ? "View single year" : "Compare two years"}
        >
          <FontAwesomeIcon
            icon={compare ? "right-long" : "left-right"}
            className="fa-fw"
          />
        </button>

        {compare && (
          <button
            onClick={() => setSymbols(!symbols)}
            data-tooltip={symbols ? "Show just text" : "Show symbols"}
          >
            <FontAwesomeIcon
              icon={symbols ? "font" : "icons"}
              className="fa-fw"
            />
          </button>
        )}

        <button
          onClick={() => setPlaying(!playing)}
          data-tooltip={playing ? "Pause" : "Play"}
        >
          <FontAwesomeIcon
            icon={playing ? "pause" : "play"}
            className="fa-fw"
          />
        </button>

        {compare && (
          <>
            <Slider
              steps={years}
              value={yearAIndex}
              onChange={(value) => setYearAIndex(Number(value))}
              tooltip={yearA}
            />
            <span>vs.</span>
          </>
        )}

        <Slider
          steps={years}
          value={yearBIndex}
          onMouseDown={() => setPlaying(false)}
          onTouchStart={() => setPlaying(false)}
          onChange={(value) => {
            setYearBIndex(Number(value));
            setPlaying(false);
          }}
          tooltip={yearB}
        />
      </div>
    </div>
  );
};

export default Neighbors;
