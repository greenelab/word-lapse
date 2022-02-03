// set CSS variables
export const setCssVariables = (variables) => {
  for (const [key, value] of Object.entries(variables))
    window.root.style.setProperty(`--${key}`, value);
};

// download data as .svg file
export const downloadSvg = (element, filename = "chart") => {
  if (!element) return;
  const clone = element.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const data = clone.outerHTML;
  const blob = new Blob([data], { type: "image/svg+xml" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  document.body.appendChild(link);
  link.href = url;
  link.download = filename + ".svg";
  link.click();
  window.URL.revokeObjectURL(url);
  link.remove();
};
