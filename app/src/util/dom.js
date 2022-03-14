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
  addAttrs = {},
  removeAttrs = []
) => {
  if (!element) return;

  // make clone of node to work with and mutate
  const clone = element.cloneNode(true);

  // always ensure xmlns so svg is valid outside of html
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  // set other custom attributes on top level svg element
  for (const [key, value] of Object.entries(addAttrs))
    clone.setAttribute(key, value);

  // remove specific attributes from all elements
  for (const element of clone.querySelectorAll("*"))
    for (const removeAttr of removeAttrs)
      for (const { name } of element.attributes)
        if (name.match(removeAttr)) {
          element.removeAttribute(name);
          continue;
        }

  // download clone as svg file
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
