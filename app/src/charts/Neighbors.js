import { useState } from "react";
import NeighborsSingle from "./NeighborsSingle";
import "./Neighbors.css";
import NeighborsCompare from "./NeighborsCompare";
import { BooleanParam, useQueryParam, withDefault } from "use-query-params";

// unique id of this chart
export const id = "neighbors";

// height of lines
export const lineHeight = 15;

// func to wrap text into lines by number of characters
// (because there is no easier way, believe me i tried)
// adjust line chars so that fitted title text size matches that of other graphs
export const wrapLines = (uniqueNeighbors, lineChars) => {
  const lines = [[]];
  for (const word of uniqueNeighbors) {
    if (
      lines[lines.length - 1].reduce((total, word) => total + word.length, 0) +
        word.length >
      lineChars
    )
      lines.push([]);
    lines[lines.length - 1].push(word);
  }
  return lines;
};

// encode/decode years to/from url
export const YearParam = (years) => ({
  encode: (yearIndex) => years[yearIndex],
  decode: (year) => {
    const match = years.findIndex((y) => y === year);
    return match === -1 ? undefined : match;
  },
});

// get default compare state from url
const getCompare = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("yearA") && params.get("yearB");
};

// get default playing state from url
const getPlaying = () =>
  !Array.from(new URLSearchParams(window.location.search)).some(([key]) =>
    key.includes("year")
  );

// neighbors list
const Neighbors = () => {
  // other state
  const [compare, setCompare] = useQueryParam(
    "compare",
    withDefault(BooleanParam, getCompare())
  );
  const [playing, setPlaying] = useState(getPlaying);

  // pass props down
  const props = { setCompare, playing, setPlaying };

  if (compare) return <NeighborsCompare {...props} />;
  return <NeighborsSingle {...props} />;
};

export default Neighbors;
