import { useContext, useEffect } from "react";
import { useQueryParam } from "use-query-params";
import { find } from "lodash";
import Slider from "../components/Slider";
import Button from "../components/Button";
import { AppContext } from "../App";
import { id, lineHeight, tagSymbol, YearParam } from "./Neighbors";
import { blue, lightGray, red } from "../palette";
import { useViewBox } from "../util/hooks";
import { blendColors } from "../util/math";
import { toHumanCase, wrapLines } from "../util/string";

// table visualization ofneighbors, single year
const NeighborsSingle = ({ setCompare, playing, setPlaying }) => {
  // app state
  const { search, results } = useContext(AppContext);
  const { neighbors, uniqueNeighbors } = results;

  // other state
  const [svg, setViewBox] = useViewBox(20);

  // compute year stuff
  const years = Object.keys(neighbors);
  const [yearIndex, setYearIndex] = useQueryParam("year", YearParam(years));
  const year = years[yearIndex] || "";
  const yearNeighbors = neighbors[year] || [];

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
        {wrapLines(uniqueNeighbors, "word", 350, 10).map(
          (line, lineIndex) => (
            <text
              key={lineIndex}
              x="0"
              y={lineHeight * lineIndex}
              textAnchor="middle"
            >
              {line.map((neighbor, index) => (
                <tspan
                  key={index}
                  dx="10"
                  style={{
                    fontSize: 10,
                    fill: find(yearNeighbors, neighbor) ? blended : lightGray,
                  }}
                  data-tooltip={`In ${neighbor.count} of the year(s). ${
                    neighbor.tagged ? `Tagged.` : "Not tagged."
                  }`}
                  aria-hidden={!find(yearNeighbors, neighbor)}
                >
                  {toHumanCase(neighbor.word)}
                  {neighbor.tagged && " " + tagSymbol}
                </tspan>
              ))}
            </text>
          )
        )}

        <text
          x="0"
          y="-30"
          textAnchor="middle"
          style={{ fontSize: 12, fontWeight: 600 }}
        >
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
