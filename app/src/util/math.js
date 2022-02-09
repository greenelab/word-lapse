// generate counting sequence
export const range = (n) =>
  Array(n)
    .fill(0)
    .map((_, i) => i);

// generate n evenly spaced numbers between 0 and max, always including 0 and max
export const spacedRange = (n, max) => {
  const steps = range(n).map((value) => value * Math.round(max / (n - 1)));
  while (max - steps[steps.length - 1] < 2) steps.pop();
  return [...steps, max];
};

// linearly interpolate
export const interpolate = (valueA, valueB, mix) =>
  valueA + (valueB - valueA) * mix;

// blend two 6-digit hex colors by % amount
export const blendColors = (colorA, colorB, mix) => {
  const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
  const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
  const r = Math.round(interpolate(rA, rB, mix)).toString(16).padStart(2, "0");
  const g = Math.round(interpolate(gA, gB, mix)).toString(16).padStart(2, "0");
  const b = Math.round(interpolate(bA, bB, mix)).toString(16).padStart(2, "0");
  return "#" + r + g + b;
};

// euclidean distance
export const dist = (x1 = 0, y1 = 0, x2 = 0, y2 = 0) =>
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
