import { Fragment } from "react";
import { blendColors, range } from "../util/math";
import { red, blue } from "../palette";
import "./Title.css";

let id = 0;
let words = ["WORD", "LAPSE"].map((word) =>
  word.split("").map((letter) => ({
    letter,
    color: blendColors(red, blue, id / 8),
    id: id++,
  }))
);

const Title = () => (
  <>
    {/* for accessibility */}
    <h1 style={{ display: "none" }}>Word Lapse</h1>

    {/* title viz */}
    <svg viewBox="-50 -25 100 50" className="title" role="presentation">
      {words.map((word, index) => (
        <text key={index} x="0" y={(index - (words.length - 1) / 2) * 30}>
          {word.map(({ letter, color, id }) => (
            <Fragment key={id}>
              <Filter id={id} color={color} />
              <tspan
                style={{
                  filter: `url(#drop-shadow-${id})`,
                }}
              >
                {letter}
              </tspan>
            </Fragment>
          ))}
        </text>
      ))}
    </svg>
  </>
);

export default Title;

const layers = 10;

const Filter = ({ id, color }) => (
  <filter id={`drop-shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
    {range(layers).map((n) => (
      <feDropShadow
        key={n}
        stdDeviation="0 0"
        in="SourceGraphic"
        dx={2 * -n / layers}
        dy={2 * n / layers}
        floodColor={color}
        floodOpacity="1"
        x="-100%"
        y="-100%"
        width="300%"
        height="300%"
        result={`drop-shadow-${n}`}
      />
    ))}
    <feMerge>
      {range(layers)
        .reverse()
        .map((n) => (
          <feMergeNode key={n} in={`drop-shadow-${n}`} />
        ))}
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);
