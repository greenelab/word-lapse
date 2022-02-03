import { useContext } from "react";
import { AppContext } from "../App";
import Chart from "../components/Chart";
import Timeline from "../charts/Timeline";
import "./Results.css";

// results section
const Results = () => {
  const { results } = useContext(AppContext);
  if (results)
    return (
      <div className="results">
        <Chart id="timeline">
          <Timeline />
        </Chart>
      </div>
    );
  else return <></>;
};

export default Results;
