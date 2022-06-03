import { useEffect, useContext, useMemo } from "react";
import { chunk, truncate } from "lodash";
import { useViewBox } from "../util/hooks";
import { AppContext } from "../App";
import { blue, gray, red, tagSymbol } from "../palette";
import { blendColors } from "../util/math";
import { join, toHumanCase } from "../util/string";

import "./Trajectory.css";

// unique id of this chart
const id = "trajectory";

// x/y spacing of grid
const xSpacing = 110;
const ySpacing = 90;

// number of neighbors to show for each year
const top = 5;

// height of lines
const lineHeight = ySpacing / (top * 1.8);

// util func to make snake pattern
const makeSnake = (array, cols, sizeX, sizeY) =>
  // make array of arrays for rows and cols
  chunk(array, cols)
    .map((row, rowIndex, rowArray) =>
      row.map((entry, colIndex) => ({
        // make point coordinates
        // flip every other row, center horizontally
        x:
          (rowIndex % 2 === 0 ? colIndex : cols - colIndex - 1) * sizeX -
          ((cols - 1) / 2) * sizeX,
        y: rowIndex * sizeY,
        // small offset in direction of snake
        // (to create gap between points and connecting lines/curves)
        offset: rowIndex % 2 === 0 ? sizeX / 10 : -sizeX / 10,
        // whether point will be under/next to a connecting curve
        underCurve:
          colIndex % cols === cols - 1 && rowIndex < rowArray.length - 1,
      }))
    )
    // make into flat array of point coords
    .flat()
    // incorporate original array back in
    .map((coords, index) => ({ ...coords, ...array[index] }));

// util func to make segments out of list of points
const segmentize = (points) => {
  // turn into segments from point to point
  let segments = [];
  for (let index = 0; index < points.length - 1; index++)
    segments.push([points[index], points[index + 1]]);

  return segments;
};

// trajectory visualization of neighbors
const Trajectory = () => {
  const { search, results } = useContext(AppContext);
  const { neighbors } = results;
  const [svg, setViewBox] = useViewBox(20);

  // fit svg viewbox after render when certain props change
  useEffect(() => {
    setViewBox();
  }, [neighbors, setViewBox]);

  // make snake of year points
  const snake = useMemo(
    () =>
      makeSnake(
        Object.entries(neighbors).map(([key, value]) => ({
          year: key,
          neighbors: value,
        })),
        4,
        xSpacing,
        ySpacing
      ),
    [neighbors]
  );

  // make segments for arrows between year points
  const segments = useMemo(() => segmentize(snake), [snake]);

  return (
    <div className="chart">
      <svg ref={svg} id={id}>
        <defs>
          <marker
            id="arrowhead"
            viewBox="-15 -10 15 20"
            markerWidth="15"
            markerHeight="15"
            refX="-3"
            orient="auto-start-reverse"
          >
            <path d="M -8 -4 L 0 0 L -8 4" fill={gray} />
          </marker>
        </defs>

        {(segments || []).map(([a, b], index) => (
          <path
            key={index}
            className="arrow"
            style={{ animationDelay: index * 0.1 + "s" }}
            d={[
              ["M", a.x + a.offset, a.y],
              a.x - b.x === 0
                ? [
                    "A",
                    ySpacing / 2,
                    ySpacing / 2,
                    0,
                    0,
                    a.x < 0 ? 0 : 1,
                    b.x + a.offset,
                    b.y,
                  ]
                : ["L", b.x - a.offset, b.y],
            ]
              .flat()
              .join(" ")}
            fill="none"
            stroke={gray}
            strokeDasharray="1 2"
            strokeLinecap="round"
            markerEnd="url(#arrowhead)"
          />
        ))}

        {snake.map(
          ({ year, x, y, neighbors, underCurve }, snakeIndex, snakeArray) => (
            <g
              key={snakeIndex}
              className="year"
              style={{ animationDelay: snakeIndex * 0.1 + "s" }}
            >
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                style={{ fontSize: "10px" }}
              >
                {year}
              </text>
              <circle
                cx={x}
                cy={y}
                r="3"
                fill={blendColors(
                  red,
                  blue,
                  snakeIndex / (snakeArray.length - 1)
                )}
                stroke="black"
                strokeWidth="1"
              />
              {neighbors
                .slice(0, top)
                .map((neighbor, neighborIndex) => ({
                  ...neighbor,
                  wordFull: neighbor.word,
                  word: truncate(neighbor.word, {
                    length: underCurve && neighborIndex === 0 ? 10 : 20,
                  }),
                }))
                .map((neighbor, neighborIndex) => (
                  <text
                    key={neighborIndex}
                    x={x}
                    y={16 + y + lineHeight * neighborIndex}
                    className="word"
                    data-tooltip={join(
                      [
                        neighbor.wordFull,
                        neighbor.tagLink,
                        `Score: ${neighbor.score}`,
                      ],
                      "<br/>"
                    )}
                    style={{
                      fontSize: "8px",
                      fill: blendColors(
                        red,
                        blue,
                        snakeIndex / (snakeArray.length - 1)
                      ),
                    }}
                    textAnchor="middle"
                  >
                    {toHumanCase(neighbor.word)}
                    {neighbor.tagged && " " + tagSymbol}
                  </text>
                ))}
            </g>
          )
        )}

        <text x="0" y="-45" textAnchor="middle" style={{ fontSize: "10px" }}>
          Top {top} associated words in each year
        </text>

        <text
          x="0"
          y="-60"
          textAnchor="middle"
          style={{ fontSize: "12px", fontWeight: 600 }}
        >
          Trajectory of "{search}" over time
        </text>
      </svg>
    </div>
  );
};

export default Trajectory;
