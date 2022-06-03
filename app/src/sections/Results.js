import { memo, useContext } from "react";
import { AppContext } from "../App";
import Frequency from "../charts/Frequency";
import Neighbors from "../charts/Neighbors";
import Trajectory from "../charts/Trajectory";
import Download from "../components/Download";
import "./Results.css";

// collection of charts to show after searching
const Results = () => {
  const { results } = useContext(AppContext);
  if (results)
    return (
      <>
        <div className="results">
          <div className="results-col">
            <Trajectory />
          </div>
          <div className="results-col">
            <Frequency />
            <Neighbors />
          </div>
        </div>
        <Download />
      </>
    );
  else return <></>;
};

export default memo(Results);
