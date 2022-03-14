import { downloadSvg } from "../util/dom";
import Button from "./Button";

// download charts as svg
const download = () => {
  const svgs = document.querySelectorAll("svg[id]");
  for (const svg of svgs)
    downloadSvg(
      svg,
      `word-lapse-${svg.id}`,
      { style: "font-family: sans-serif;" },
      [/^data-.*/, /^aria-.*/]
    );
};

// download button
const Download = () => (
  <Button text="Download SVGs" icon="download" onClick={download} />
);

export default Download;
