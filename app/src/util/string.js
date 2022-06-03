// split string and convert to Human Case
export const toHumanCase = (string) =>
  string
    .replace(/[^a-zA-Z0-9.-]/g, " ")
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
    .join(" ");

// wrap list of items into lines by string width
// for SVG which lacks any better way to wrap text
// key: property of each object of array to access as string/word
// width: line width limit
// size: font size to use for measuring width (in px)
export const wrapLines = (array, key, width, size = 12) => {
  const lines = [[]];

  // running line char count
  let total = 0;
  for (const item of array) {
    // width of current item
    const w = getWidth(item[key], size);

    if (
      // if this word will cause line to overflow
      total + w > width &&
      // and line is not empty
      total > 0
    ) {
      // start new line
      lines.push([]);
      // reset char count
      total = 0;
    }

    // add item to line
    lines[lines.length - 1].push(item);
    // increment running char count
    total += w;
  }
  return lines;
};

// get actual pixel width of string rendered in font
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
export const getWidth = (text, size) => {
  ctx.font = `${size}px Quicksand`;
  const { width } = ctx.measureText(text);
  return width;
};

// filter array and join
export const join = (array = [], separator = " ") =>
  array.filter((part) => part.trim()).join(separator);

// convert number to compact form (e.g. with "k" for 1000)
const formatter = Intl.NumberFormat("en", { notation: "compact" });
export const compactNumber = (value) =>
  value < 1 ? value.toExponential(1) : formatter.format(value).toLowerCase();

// get axis tick labels for log scale
export const logLabel = (powers, format) => (d) =>
  // only return label if number is a "multiple" of one of powers
  // otherwise skip tick (give it a blank label)
  powers.some((power) => Math.log10(d / power) % 1 === 0) ? format(d) : "";
