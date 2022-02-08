import { useEffect } from "react";
import { blendColors, interpolate, splitArray } from "./util";
import { red, blue } from "./palette";
import "./Title.css";

// letters to spell out
let letters = "WordLapse";

// number of layers to create drop shadow effect
// more = smoother look, less = faster performance
let layers = 10;

// where to break text into words
let words = [4];

// gradient colors of drop shadow effect
const colorA = red;
const colorB = blue;

// base length of drop shadow effect (in em)
const fromLength = 0.05;

// length of drop shadow effect to animate to (in em)
const toLength = 0.15;

// stroke width (in em)
const fromStrokeWidth = 0.15;
const toStrokeWidth = 0.05;

// animation duration (in sec)
const duration = 5;

// layer parameters
layers = Array(layers)
  .fill({})
  .map((layer, index) => ({
    colors: [colorA, colorB],
    from: (fromLength * index) / layers,
    to: (toLength * index) / layers,
    stroke: interpolate(fromStrokeWidth, toStrokeWidth, index / layers),
  }));
// make copies of last layer and make them black/white for readability
const last = layers.pop();
layers.push({ ...last, colors: ["#000000", "#000000"] });
layers.push({ ...last, colors: ["#ffffff", "#ffffff"], stroke: 0 });

// letter parameters, and break letters into words
words = splitArray(
  letters.split("").map((letter, index) => ({
    char: letter,
    blend: index / (letters.length - 1),
    delay: index * duration * 70,
  })),
  words
);

// precompute and combine layer and letter props
words = words.map((word) =>
  layers.map(({ colors, from, to, stroke }) =>
    word.map(({ char, blend, delay }) => ({
      char,
      from: `translate(${from}em, ${-from}em)`,
      to: `translate(${to}em, ${-to}em)`,
      delay,
      color: blendColors(...colors, blend),
      stroke: `currentColor ${stroke}em`,
    }))
  )
);

// animate element with web animation api
const animate = (element) => {
  const from = element.getAttribute("data-from");
  const to = element.getAttribute("data-to");
  const delay = element.getAttribute("data-delay");
  element.animate(
    [
      {
        transform: from,
        offset: 0.0,
        easing: "ease-in-out",
      },
      {
        transform: to,
        offset: 0.2,
        easing: "ease-in-out",
      },
      {
        transform: from,
        offset: 0.4,
        easing: "linear",
      },
      {
        transform: from,
        offset: 1.0,
        easing: "linear",
      },
    ],
    {
      duration: duration * 1000,
      delay,
      iterations: Infinity,
      fill: "both",
    }
  );
};

const Title = () => {
  // attach animations once after first render
  useEffect(() => {
    document.querySelectorAll(".letter").forEach(animate);
  }, []);

  return (
    <>
      {/* for accessibility */}
      <h1 style={{ display: "none" }}>Word Lapse</h1>

      {/* title viz */}
      <div className="title" role="presentation">
        {words.map((layers, index) => (
          <div key={index} className="word">
            {layers.map((letters, index) => (
              <div key={index} className="layer">
                {letters.map(
                  ({ char, from, to, delay, color, stroke }, index) => (
                    <span
                      key={index}
                      className="letter"
                      data-from={from}
                      data-to={to}
                      data-delay={delay}
                      style={{
                        color: color,
                        WebkitTextStroke: stroke,
                      }}
                    >
                      {char}
                    </span>
                  )
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="subtitle">
        Explore how a word changes in meaning over time
      </div>
    </>
  );
};

export default Title;
