import { useRef, cloneElement } from "react";
import { ParentSize } from "@visx/responsive";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { downloadSvg } from "./util";
import "./Chart.css";

// container for one chart
const Chart = ({ children = <></>, ...rest }) => {
  const ref = useRef();

  return (
    <div ref={ref} className="chart">
      <ParentSize debounceTime={10}>
        {({ width, height }) =>
          cloneElement(children, { width, height, ...rest })
        }
      </ParentSize>
      <button
        className="download"
        onClick={() => downloadSvg(ref.current?.querySelector("svg"))}
      >
        <FontAwesomeIcon icon="download" />
      </button>
    </div>
  );
};

export default Chart;
