import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { downloadSvg } from "../util/dom";

// download charts as svg
const download = () => {
  const svgs = document.querySelectorAll("svg[id]");
  for (const svg of svgs)
    downloadSvg(
      svg,
      `word-lapse-${svg.id}`,
      [
        ["xmlns", "http://www.w3.org/2000/svg"],
        ["style", "font-family: sans-serif;"],
      ],
      ["data-tooltip"]
    );
};

// download button
const Download = () => (
  <button className="download" onClick={() => download()}>
    <FontAwesomeIcon icon="download" />
    <span>Download SVGs</span>
  </button>
);

export default Download;
