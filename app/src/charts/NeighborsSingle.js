import { useContext, useEffect } from "react";
import { useQueryParam } from "use-query-params";
import Slider from "../components/Slider";
import Button from "../components/Button";
import { AppContext } from "../App";
import { id, lineHeight, wrapLines, YearParam } from "./Neighbors";
import { blue, lightGray, red } from "../palette";
import { useViewBox } from "../util/hooks";
import { blendColors } from "../util/math";
import { toHumanCase } from "../util/string";
import { count } from "../util/neighbors";

// single year neighbors list
const NeighborsSingle = ({ setCompare, playing, setPlaying }) => {
  // app state
  const { search, results } = useContext(AppContext);
  const { neighbors: neighborsData, uniqueNeighbors, tags } = results;

  // other state
  const [svg, setViewBox] = useViewBox(20);

  // compute year stuff
  const years = Object.keys(neighborsData);
  const [yearIndex, setYearIndex] = useQueryParam("year", YearParam(years));
  const year = years[yearIndex] || "";
  const neighbors = neighborsData[year] || [];

  // animate year index
  useEffect(() => {
    let interval;
    if (playing)
      interval = window.setInterval(
        () => setYearIndex((value) => (value + 1) % years.length, "replaceIn"),
        1000
      );
    return () => window.clearInterval(interval);
  }, [playing, years.length, setYearIndex]);

  // fit svg viewbox after render when certain props change
  useEffect(() => {
    setViewBox();
  }, [uniqueNeighbors.length, setViewBox]);

  // if year not in url on mount, init to 0 and force url encode
  useEffect(() => {
    if (yearIndex === undefined) setYearIndex(0);
  }, [yearIndex, setYearIndex]);

  // current year color
  const blended = blendColors(red, blue, yearIndex / (years.length - 1));

  return (
    <div className="chart">
      <svg ref={svg} id={id}>
        {wrapLines(uniqueNeighbors, 70).map((line, lineIndex) => (
          <text
            key={lineIndex}
            x="0"
            y={lineHeight * lineIndex}
            textAnchor="middle"
          >
            {line.map((word, index) => (
              <tspan
                key={index}
                className="neighbors-word"
                dx="10"
                style={{
                  fontSize: 10,
                  fill: neighbors.includes(word) ? blended : lightGray,
                }}
                data-tooltip={`In ${count(
                  word,
                  neighborsData
                )} of the year(s). ${tags[word] ? `Tagged.` : "Not tagged."}`}
                aria-hidden={!neighbors.includes(word)}
                tabIndex={!neighbors.includes(word) ? -1 : 0}
              >
                {toHumanCase(word)}
                {tags[word] && "*"}
              </tspan>
            ))}
          </text>
        ))}

        <text x="0" y="-30" textAnchor="middle" style={{ fontSize: 12 }}>
          Words associated with "{search}" in {year}
        </text>
      </svg>

      <div className="chart-controls">
        <Button
          icon="left-right"
          onClick={() => setCompare(true)}
          data-tooltip="Compare two years"
        />

        <Button
          icon={playing ? "pause" : "play"}
          onClick={() => setPlaying(!playing)}
          data-tooltip={playing ? "Pause" : "Play"}
        />

        <Slider
          steps={years}
          value={yearIndex}
          onMouseDown={() => setPlaying(false)}
          onTouchStart={() => setPlaying(false)}
          onChange={(value) => {
            setYearIndex(Number(value), "replaceIn");
            setPlaying(false);
          }}
          tooltip={year}
          label={`"Year": ${year}`}
        />
      </div>
    </div>
  );
};

export default NeighborsSingle;