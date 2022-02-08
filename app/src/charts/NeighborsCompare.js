import { useContext, useState, useEffect, useMemo, Fragment } from "react";
import { AppContext } from "../App";
import Slider from "../components/Slider";
import { blue, lightGray, red } from "../palette";
import { useViewBox } from "../util/hooks";
import { toHumanCase } from "../util/string";
import "./Neighbors.css";

// unique id of this chart
const id = "neighbors-compare";

// width of lines
const width = 100;
// height of lines
const height = 15;

// neighbors list for singe year
const NeighborsSingle = () => {
  const { search, results } = useContext(AppContext);
  const { neighbors, uniqueNeighbors } = results;
  const years = Object.keys(neighbors);
  const [yearAIndex, setYearAIndex] = useState(0);
  const [yearBIndex, setYearBIndex] = useState(0);
  const yearA = years[yearAIndex];
  const yearB = years[yearBIndex];
  const ANeighbors = neighbors[yearA];
  const BNeighbors = neighbors[yearB];
  const [svg, setViewBox] = useViewBox(20);

  // fit svg viewbox after render when unique neighbors changes
  useEffect(() => {
    setViewBox();
  }, [yearA, yearB, uniqueNeighbors.length, setViewBox]);

  const commonNeighbors = useMemo(
    () =>
      uniqueNeighbors.filter(
        (word) => ANeighbors.includes(word) || BNeighbors.includes(word)
      ),
    [uniqueNeighbors, ANeighbors, BNeighbors]
  );

  const rows = 20;
  const cols = Math.ceil(commonNeighbors.length / rows);

  return (
    <div className="chart">
      <svg ref={svg} id={id}>
        <rect
          x={-1.25 * cols * width}
          y="0"
          width={2.5 * cols * width}
          height={rows * height}
          opacity={0}
        />
        <Side
          commonNeighbors={commonNeighbors}
          neighbors={ANeighbors}
          x={-1}
          cols={cols}
          color={red}
        />
        <Side
          commonNeighbors={commonNeighbors}
          neighbors={BNeighbors}
          x={1}
          cols={cols}
          color={blue}
        />
        <text x="0" y="-40" textAnchor="middle" style={{ fontSize: 12 }}>
          Words associated with "{search}" in {yearA} vs. {yearB}
        </text>
      </svg>
      <div className="chart-controls">
        <Slider
          steps={years}
          value={yearAIndex}
          onChange={(value) => setYearAIndex(Number(value))}
          tooltip={yearA}
        />
        <span>vs.</span>
        <Slider
          steps={years}
          value={yearBIndex}
          onChange={(value) => setYearBIndex(Number(value))}
          tooltip={yearB}
        />
      </div>
    </div>
  );
};

export default NeighborsSingle;

const Side = ({ commonNeighbors, neighbors, cols, x, color }) =>
  commonNeighbors.map((word, index) => (
    <Fragment key={index}>
      <text
        className="neighbors-word"
        x={(x + x * (index % cols)) * width}
        y={Math.floor(index / cols) * height}
        textAnchor="middle"
        style={{
          fontSize: 10,
          fill: neighbors.includes(word) ? color : lightGray,
        }}
        aria-hidden={!neighbors.includes(word)}
        tabIndex={neighbors.includes(word) ? 0 : -1}
      >
        {toHumanCase(word)}
      </text>
    </Fragment>
  ));
