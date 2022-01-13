import { useState, useEffect, useCallback } from "react";

// blend two 6-digit hex colors by % amount
export const blendColors = (colorA, colorB, amount) => {
  const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
  const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
  const r = Math.round(rA + (rB - rA) * amount)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(gA + (gB - gA) * amount)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(bA + (bB - bA) * amount)
    .toString(16)
    .padStart(2, "0");
  return "#" + r + g + b;
};

// split array into chunks at certain split
export const splitArray = (array = [], splits = []) => {
  const chunks = [];
  for (const split of splits.reverse()) chunks.push(array.splice(split));
  chunks.push(array);
  return chunks.reverse();
};

// basic euclidean distance
export const dist = (x1 = 0, y1 = 0, x2 = 0, y2 = 0) =>
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

// use debounce react hook
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// useState react hook, but synced to url parameter
export const useQueryState = (key, defaultValue) => {
  // get param from url
  const getQuery = useCallback(
    (key) => new URLSearchParams(window.location.search).get(key),
    []
  );

  // set param in url and set url
  const setQuery = useCallback((key, value) => {
    // get current url
    const { pathname, href, search } = window.location;
    const url = new URL(pathname, href).href;

    // get new search param
    const params = new URLSearchParams();
    params.set(key, value);
    const newSearch = value.trim() ? "?" + params.toString() : "";

    // don't update if already on desired search param
    if (search === newSearch) return;

    // update url
    window.history.pushState(null, null, url + newSearch);
  }, []);

  // state value, defaults to param gotten from url
  const [value, setValue] = useState(getQuery(key));

  // when user navigates back/forward
  useEffect(() => {
    // get value from url again as if page had just loaded again
    const onNav = () => setValue(getQuery(key));

    // listen for user back/forward nav
    window.addEventListener("popstate", onNav);
    return () => window.removeEventListener("popstate", onNav);
  }, [getQuery, key]);

  // modified setState func to return
  const setState = useCallback(
    (value) => {
      // update state
      setValue(value);
      // update url
      setQuery(key, value);
    },
    [setQuery, key]
  );

  return [value || defaultValue, setState];
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
