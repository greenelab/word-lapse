import { color } from "d3-color";
import { interpolateHcl as interpolate } from "d3-interpolate";

// blend two colors by specified % amount
export const blendColors = (colorA, colorB, mix) =>
  color(interpolate(color(colorA), color(colorB))(mix)).formatHex();

// euclidean distance
export const dist = (x1 = 0, y1 = 0, x2 = 0, y2 = 0) =>
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
