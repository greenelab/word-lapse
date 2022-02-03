import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { downloadSvg } from "../util/dom";
import { useViewBox } from "../util/hooks";
import "./Chart.css";

// container for one chart
const Chart = ({ id, children }) => {
  const ref = useRef();
  const [svg, viewBox] = useViewBox();

  return (
    <div ref={ref} className="chart">
      <svg ref={svg} viewBox={viewBox} id={id}>
        {children}
      </svg>
      <button
        className="download"
        onClick={() => downloadSvg(ref.current?.querySelector("svg"))}
        title="Download this chart as an SVG"
      >
        <FontAwesomeIcon icon="download" />
      </button>
    </div>
  );
};

export default Chart;
