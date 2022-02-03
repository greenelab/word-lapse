import { useContext } from "react";
import { purple, lightPurple, darkGray } from "../palette";
import { AppContext } from "../App";

// frequency timeline chart
const Timeline = ({ width, height }) => {
  const { search, results } = useContext(AppContext);
  const { frequency_timeline: data } = results;

  return <rect x="-10" y="-10" width="300" height="300" fill="red" />;
};

export default Timeline;
