import { useContext } from "react";
import { AppContext } from "../App";
import Timeline from "../charts/Timeline";
import NeighborsSingle from "../charts/NeighborsSingle";
import NeighborsCompare from "../charts/NeighborsCompare";
import Download from "../components/Download";
import "./Results.css";

// collection of charts to show after searching
const Results = () => {
  const { results } = useContext(AppContext);
  if (results)
    return (
      <>
        <div className="results">
          <Timeline />
          <NeighborsSingle />
          <NeighborsCompare />
        </div>
        <Download />
      </>
    );
  else return <></>;
};

export default Results;
