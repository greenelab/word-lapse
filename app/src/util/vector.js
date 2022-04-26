import { dist } from "./math";

// normalize vector
const normalize = (a) => {
  const length = dist(a.x, a.y);
  return { x: a.x / length || 0, y: a.y / length || 0 };
};

// add vectors
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });

// subtract vectors
const subtract = (a, b) => ({ x: b.x - a.x, y: b.y - a.y });

// scale vector
const scale = (a, scaleX, scaleY) => ({
  x: a.x * scaleX,
  y: a.y * (scaleY || scaleX),
});

// rotate vector 90 degrees
const rotate = (a) => ({ x: a.y, y: -a.x });

// shorten segment by amount on each side
export const shorten = (a, b, lengthX, lengthY) => {
  const nub = scale(normalize(subtract(a, b)), lengthX, lengthY);
  a = add(a, nub);
  b = add(b, scale(nub, -1));
  return [a, b];
};

// get vector normal to "elbow" between three points
const elbowNormal = (a, b, c) => {
  // end points
  if (!a && c) return normalize(subtract(b, c));
  if (a && !c) return normalize(subtract(b, a));
  // get angle bisector vector
  const bisector = normalize(
    add(normalize(subtract(b, a)), normalize(subtract(b, c)))
  );
  // if colinear, just use perpendicular
  if (dist(bisector.x, bisector.y) === 0)
    return normalize(rotate(subtract(b, a)));
  // otherwise, use bisector
  else return bisector;
};

// get "elbow" point between three points, some distance away
export const elbow = (a, b, c, lengthX, lengthY) =>
  add(b, scale(elbowNormal(a, b, c), -lengthX, -lengthY));
