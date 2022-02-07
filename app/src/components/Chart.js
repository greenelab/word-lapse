import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { downloadSvg } from "../util/dom";
import "./Chart.css";

// download chart as svg
const download = (chart) => {
  const svg = chart?.querySelector("svg");
  if (!svg) return;
  const id = svg.id;
  downloadSvg(
    svg,
    `word-lapse-${id}`,
    [
      ["xmlns", "http://www.w3.org/2000/svg"],
      ["style", "font-family: sans-serif;"],
    ],
    ["data-tooltip"]
  );
};

// container for one chart
const Chart = ({ children }) => {
  const ref = useRef();

  return (
    <div ref={ref} className="chart">
      {children}
      <div className="chart-controls">
        <button
          className="download"
          onClick={() => download(ref.current)}
          title="Download this chart as an SVG"
        >
          <FontAwesomeIcon icon="download" />
        </button>
      </div>
    </div>
  );
};

export default Chart;
