import { useContext } from "react";
import { AppContext } from "./App";
import Chart from "./Chart";
import Timeline from "./Timeline";
import "./Results.css";

const Results = () => {
  const { results } = useContext(AppContext);
  if (results)
    return (
      <div className="results">
        <Chart>
          <Timeline />
        </Chart>
        <Chart>
          <Timeline />
        </Chart>
        <Chart>
          <Timeline />
        </Chart>
        <Chart>
          <Timeline />
        </Chart>
      </div>
    );
  else return <></>;
};

export default Results;
