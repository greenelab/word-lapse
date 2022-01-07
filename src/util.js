// blend two 6-digit hex colors by % amount
export const blendColors = (colorA, colorB, amount) => {
  const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
  const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
  const r = Math.round(rA + (rB - rA) * amount)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(gA + (gB - gA) * amount)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(bA + (bB - bA) * amount)
    .toString(16)
    .padStart(2, "0");
  return "#" + r + g + b;
};

// split array into chunks at certain split
export const splitArray = (array = [], splits = []) => {
  const chunks = [];
  for (const split of splits.reverse()) chunks.push(array.splice(split));
  chunks.push(array);
  return chunks.reverse();
};

export const dist = (x1 = 0, y1 = 0, x2 = 0, y2 = 0) =>
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
