import { useContext, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppContext } from "../App";
import Slider from "../components/Slider";
import { blue, lightGray, red } from "../palette";
import { useViewBox } from "../util/hooks";
import { blendColors } from "../util/math";
import { toHumanCase } from "../util/string";
import { count } from "./neighbors";
import "./Neighbors.css";

// unique id of this chart
const id = "neighbors-single";

// max char width of lines
const chars = 60;
// height of lines
const height = 15;

// neighbors list for singe year
const NeighborsSingle = () => {
  const { search, results } = useContext(AppContext);
  const { neighbors, uniqueNeighbors } = results;
  const years = Object.keys(neighbors);
  const [yearIndex, setYearIndex] = useState(0);
  const year = years[yearIndex];
  const currentNeighbors = neighbors[year];
  const [playing, setPlaying] = useState(true);
  const [svg, setViewBox] = useViewBox(20);

  // animate year index
  useEffect(() => {
    let interval;
    if (playing)
      interval = window.setInterval(
        () => setYearIndex((value) => (value + 1) % years.length),
        1000
      );
    return () => window.clearInterval(interval);
  }, [playing, years.length]);

  // fit svg viewbox after render when unique neighbors changes
  useEffect(() => {
    setViewBox();
  }, [uniqueNeighbors.length, setViewBox]);

  // current year color
  const color = blendColors(red, blue, yearIndex / (years.length - 1));

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
            {line.map((word, index) => (
              <tspan
                key={index}
                className="neighbors-word"
                dx="10"
                style={{
                  fontSize: 10,
                  fill: currentNeighbors.includes(word) ? color : lightGray,
                }}
                data-tooltip={`In ${count(word, neighbors)} of the year(s)`}
                aria-hidden={!currentNeighbors.includes(word)}
                tabIndex={currentNeighbors.includes(word) ? 0 : -1}
              >
                {toHumanCase(word)}
              </tspan>
            ))}
          </text>
        ))}
        <text x="0" y="-40" textAnchor="middle" style={{ fontSize: 12 }}>
          Words associated with "{search}" in {year}
        </text>
      </svg>
      <div className="chart-controls">
        <button
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause" : "Play"}
        >
          <FontAwesomeIcon icon={playing ? "pause" : "play"} />
        </button>
        <Slider
          steps={years}
          value={yearIndex}
          onChange={(value) => {
            setYearIndex(Number(value));
            setPlaying(false);
          }}
          tooltip={year}
        />
      </div>
    </div>
  );
};

export default NeighborsSingle;
