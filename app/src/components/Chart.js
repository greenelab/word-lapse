import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { downloadSvg } from "../util/dom";
import "./Chart.css";

// container for one chart
const Chart = ({ children }) => {
  const ref = useRef();

  return (
    <div ref={ref} className="chart">
      {children}
      <div className="chart-controls">
        <button
          className="download"
          onClick={() => downloadSvg(ref.current?.querySelector("svg"))}
          title="Download this chart as an SVG"
        >
          <FontAwesomeIcon icon="download" />
        </button>
      </div>
    </div>
  );
};

export default Chart;
