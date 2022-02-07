import { useContext } from "react";
import { AppContext } from "../App";
import Chart from "../components/Chart";
import Timeline from "../charts/Timeline";
import Neighbors from "../charts/Neighbors";
import "./Results.css";

// collection of charts to show after searching
const Results = () => {
  const { results } = useContext(AppContext);
  if (results)
    return (
      <div className="results">
        <Chart>
          <Neighbors />
        </Chart>
        <Chart>
          <Timeline />
        </Chart>
        <Chart>
          <svg viewBox="0 0 200 100">
            <rect x="0" y="0" width="200" height="100" fill="#808080" />
          </svg>
        </Chart>
      </div>
    );
  else return <></>;
};

export default Results;
