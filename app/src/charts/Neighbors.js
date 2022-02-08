import { useContext, useState, useEffect, useMemo } from "react";
import { AppContext } from "../App";
import { blue, lightGray, red } from "../palette";
import { useViewBox } from "../util/hooks";
import { blendColors } from "../util/math";
import { toHumanCase } from "../util/string";
import "./Neighbors.css";

// unique id of this chart
const id = "neighbors";

// max char width of lines
const chars = 60;
// height of lines
const height = 15;

// word neighbors network
const Neighbors = () => {
  const { search, results } = useContext(AppContext);
  const { neighbors } = results;
  const years = Object.keys(neighbors);
  const [yearIndex, setYearIndex] = useState(0);
  const year = years[yearIndex];
  const currentNeighbors = neighbors[year];
  const [svg, setViewBox] = useViewBox(30);

  // get a de-duped, sorted list of unique neighbors
  const uniqueNeighbors = useMemo(
    () => Array.from(new Set(Object.values(neighbors).flat())).sort(),
    [neighbors]
  );

  // animate year index
  useEffect(() => {
    const interval = window.setInterval(
      () => setYearIndex((value) => (value + 1) % years.length),
      2000
    );
    return () => window.clearInterval(interval);
  }, [years.length]);

  // fit svg viewbox after render when unique neighbors changes
  useEffect(() => {
    setViewBox();
  }, [uniqueNeighbors.length, setViewBox]);

  // wrap text into lines by number of characters
  // (because there is no easier way, believe me i tried)
  const lines = [[]];
  for (const neighbor of uniqueNeighbors) {
    if (
      lines[lines.length - 1].reduce((total, word) => total + word.length, 0) >
      chars
    )
      lines.push([]);
    lines[lines.length - 1].push(neighbor);
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
            {line.map((neighbor, index) => (
              <tspan
                key={index}
                className="neighbors-word"
                dx="10"
                style={{
                  fontSize: 10,
                  fill: currentNeighbors.includes(neighbor)
                    ? blendColors(red, blue, yearIndex / (years.length - 1))
                    : lightGray,
                }}
              >
                {toHumanCase(neighbor)}
              </tspan>
            ))}
          </text>
        ))}
        <text x="0" y="-40" textAnchor="middle" style={{ fontSize: 12 }}>
          Words associated with "{search}" in {year}
        </text>
      </svg>
      <div className="chart-controls">
        <span>{year}</span>
        <input
          className="slider"
          value={yearIndex}
          onChange={(event) => setYearIndex(Number(event.target.value))}
          type="range"
          min={0}
          max={years.length - 1}
          step={1}
        />
      </div>
    </div>
  );
};

export default Neighbors;
