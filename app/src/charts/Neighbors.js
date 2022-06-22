import { useState } from "react";
import { BooleanParam, useQueryParam, withDefault } from "use-query-params";
import NeighborsSingle from "./NeighborsSingle";
import NeighborsCompare from "./NeighborsCompare";
import "./Neighbors.css";

// unique id of this chart
export const id = "neighbors";

// height of lines
export const lineHeight = 15;

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

// table visualization of neighbors
const Neighbors = () => {
  // other state
  const [compare, setCompare] = useQueryParam(
    "compare",
    withDefault(BooleanParam, getCompare())
  );
  const [playing, setPlaying] = useState(false);

  // pass props down
  const props = { setCompare, playing, setPlaying };

  if (compare) return <NeighborsCompare {...props} />;
  return <NeighborsSingle {...props} />;
};

export default Neighbors;
