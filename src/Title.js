import { blendColors, splitArray } from "./util";
import "./Title.css";

// gradient colors of drop shadow effect
const colorA = "#e91e63";
const colorB = "#03a9f4";

// number of layers to create drop shadow effect, more = smoother look, less = faster performance
const layerCount = 5;

// base length of drop shadow effect (in em)
const fromLength = 0.05;

// length of drop shadow effect to animate to (in em)
const toLength = 0.15;

// stroke width (in em)
const strokeWidth = 0.05;

// text to spell out
const text = "WordLapse";

// where to break text into words
const breaks = [4];

// layer parameters
const layers = Array(layerCount)
  .fill({})
  .map((_, index) => ({
    color: [colorA, colorB],
    from: (fromLength * index) / layerCount,
    to: (toLength * index) / layerCount,
  }));
// make copies of last colored layer and make them black/white for readability
const { from, to } = layers.pop();
layers.push({ color: ["#000000", "#000000"], from, to });
layers.push({ color: ["#ffffff", "#ffffff"], from, to, stroke: "none" });

// text parameters
const letters = text.split("").map((letter, index, array) => ({
  index,
  char: letter,
  blend: index / (array.length - 1),
  delay: index * 300,
}));
// put in word break
const words = splitArray(letters, breaks);

// generate animation with web animation api
const animate = ({ element, fromTransform, toTransform, delay }) =>
  element.animate(
    [
      {
        transform: fromTransform,
        offset: 0.0,
        easing: "ease",
      },
      {
        transform: toTransform,
        offset: 0.3,
        easing: "ease",
      },
      {
        transform: fromTransform,
        offset: 0.6,
        easing: "linear",
      },
      {
        transform: fromTransform,
        offset: 1.0,
        easing: "linear",
      },
    ],
    {
      duration: 4000,
      delay,
      iterations: Infinity,
    }
  );

const Title = () => (
  <div className="title" role="presentation">
    {words.map((letters, index) => (
      <div key={index} className="word">
        {layers.map(({ color, from, to, stroke }, index) => (
          <div key={index} className="layer">
            {letters.map(({ index, char, delay, blend }) => {
              // blend between color A and B to make gradient
              const blendedColor = blendColors(...color, blend);

              // starting position of letters
              const fromTransform = `translate(${from}em, ${-from}em)`;
              // "animate to" position of letters
              const toTransform = `translate(${to}em, ${-to}em)`;

              // support new lines
              if (char === "\n") return <br key={index} />;

              return (
                <span
                  key={index}
                  className="letter"
                  ref={(element) => {
                    if (element)
                      animate({ element, fromTransform, toTransform, delay });
                    return element;
                  }}
                  style={{
                    // fill color
                    color: blendedColor,
                    // base transform before animation starts
                    transform: fromTransform,
                    // stroke effect
                    WebkitTextStroke:
                      stroke || `${blendedColor} ${strokeWidth}em`,
                  }}
                >
                  {char === " " ? <>&nbsp;</> : char}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    ))}
  </div>
);

export default Title;
