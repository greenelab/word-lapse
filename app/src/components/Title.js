import { Fragment } from "react";
import { blendColors, range } from "../util/math";
import { red, blue } from "../palette";
import "./Title.css";

// letter props
let letters = "WORDLAPSE".split("").map((letter, index, { length }) => ({
  char: letter,
  color: blendColors(red, blue, index / (length - 1)),
  id: index,
}));
// manually kern because tspan's cannot have filters
const kern = [
  [-29, -7, 13, 31],
  [-36, -18, 0, 19, 36],
];
// split into words and position
const words = [letters.slice(0, 4), letters.slice(4)];
words.forEach((word, wordIndex) =>
  word.forEach((letter, letterIndex) => {
    letter.x = kern[wordIndex][letterIndex];
  })
);

// svg viewbox
const width = 90;
const height = 25;

// app title in header
const Title = () => (
  <div
    className="title"
    role="heading"
    aria-level={1}
    aria-label="Word Lapse"
    tabIndex={0}
  >
    {words.map((word, index) => (
      <svg
        key={index}
        viewBox={[-width / 2, -height / 2, width, height].join(" ")}
      >
        {word.map(({ char, color, x, id }, index) => (
          <Fragment key={index}>
            <Filter id={id} color={color} />
            <text
              key={index}
              x={x}
              y="1"
              aria-hidden="true"
              filter={`url(#drop-shadow-${id})`}
            >
              {char}
            </text>
          </Fragment>
        ))}
      </svg>
    ))}
  </div>
);

export default Title;

const layers = 10;

const Filter = ({ id, color }) => (
  <filter id={`drop-shadow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
    {range(layers).map((n) => (
      <feDropShadow
        key={n}
        stdDeviation="0 0"
        in="SourceGraphic"
        dx={(2 * -n) / layers}
        dy={(2 * n) / layers}
        floodColor={color}
        floodOpacity="1"
        x="-100%"
        y="-100%"
        width="300%"
        height="300%"
        result={`drop-shadow-${n}`}
        colorInterpolationFilters="sRGB"
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
