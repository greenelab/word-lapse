import { useContext } from "react";
import { AppContext } from "../App";
import Frequency from "../charts/Frequency";
import Neighbors from "../charts/Neighbors";
import Umap from "../charts/Umap";
import Download from "../components/Download";
import "./Results.css";

// collection of charts to show after searching
const Results = () => {
  const { results } = useContext(AppContext);
  if (results)
    return (
      <>
        <div className="results">
          {/* <Neighbors />
          <Frequency /> */}
          <Umap />
        </div>
        <Download />
      </>
    );
  else return <></>;
};

export default Results;
