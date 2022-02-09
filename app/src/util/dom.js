import { svgPathProperties } from "svg-path-properties";

// set CSS variables
export const setCssVariables = (variables) => {
  for (const [key, value] of Object.entries(variables))
    window.root.style.setProperty(`--${key}`, value);
};

// download data as .svg file
export const downloadSvg = (
  element,
  filename = "chart",
  addAttrs = [],
  deleteAttrs = []
) => {
  if (!element) return;
  const clone = element.cloneNode(true);
  for (const [key, value] of addAttrs) clone.setAttribute(key, value);
  for (const deleteAttr of deleteAttrs)
    clone
      .querySelectorAll(`[${deleteAttr}]`)
      .forEach((el) => el.removeAttribute(deleteAttr));
  const data = clone.outerHTML;
  const blob = new Blob([data], { type: "image/svg+xml" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename + ".svg";
  link.click();
  window.URL.revokeObjectURL(url);
};

// get length of svg path string
export const getPathLength = (string) => {
  try {
    const properties = new svgPathProperties(string);
    return properties.getTotalLength();
  } catch {
    return 1000;
  }
};
