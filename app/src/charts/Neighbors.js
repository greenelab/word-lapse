import { useContext, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppContext } from "../App";
import Slider from "../components/Slider";
import { blue, lightGray, purple, red } from "../palette";
import { useViewBox } from "../util/hooks";
import { blendColors } from "../util/math";
import { toHumanCase } from "../util/string";
import { count } from "../util/neighbors";
import "./Neighbors.css";

// unique id of this chart
const id = "neighbors";

// max char width of lines
const chars = 60;
// height of lines
const height = 15;

// symbols for color blind
const symbolChars = {
  a: "♥",
  b: "♠",
  both: "♦",
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
  const [svg, setViewBox] = useViewBox(20);

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

  // fit svg viewbox after render when unique neighbors changes
  useEffect(() => {
    setViewBox();
  }, [uniqueNeighbors.length, setViewBox]);

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

              let symbol;
              if (compare) {
                if (inA && inB) symbol = symbolChars.both;
                else if (inA) symbol = symbolChars.a;
                else if (inB) symbol = symbolChars.b;
              }

              // determine word color
              let color;
              if (compare) {
                if (inA && inB) color = purple;
                else if (inA) color = red;
                else if (inB) color = blue;
              } else {
                if (inB) color = blended;
              }

              // determine tooltip text
              let tooltip;
              if (compare) {
                if (inA && inB) tooltip = `In ${yearA} and ${yearB}`;
                else if (inA) tooltip = `In ${yearA}`;
                else if (inB) tooltip = `In ${yearB}`;
              } else {
                tooltip = `In ${count(word, neighbors)} of the year(s)`;
              }

              return (
                <tspan
                  key={index}
                  className="neighbors-word"
                  dx="10"
                  style={{
                    fontSize: 10,
                    fill: color || lightGray,
                  }}
                  data-tooltip={tooltip}
                  aria-hidden={!color}
                  tabIndex={!color ? -1 : 0}
                >
                  {symbols && symbol} {toHumanCase(word)}
                </tspan>
              );
            })}
          </text>
        ))}
        <text x="0" y="-40" textAnchor="middle" style={{ fontSize: 12 }}>
          Words associated with "{search}" in{" "}
          {compare && (
            <>
              <tspan fill={red}>
                {symbols && symbolChars.a} {yearA}
              </tspan>
              <tspan> vs. </tspan>
              <tspan fill={blue}>
                {symbols && symbolChars.b} {yearB}
              </tspan>
              <tspan fill={purple}>
                {" "}
                (or {symbols && symbolChars.both} both
              </tspan>
              )
            </>
          )}
          {!compare && yearB}
        </text>
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
            data-tooltip={symbols ? "Hide symbols" : "Show symbols"}
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
