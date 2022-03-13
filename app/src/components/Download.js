import { downloadSvg } from "../util/dom";
import Button from "./Button";

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
  <Button text="Download SVGs" icon="download" onClick={download} />
);

export default Download;
