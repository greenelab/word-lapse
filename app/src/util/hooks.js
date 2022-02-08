import { useState, useEffect, useCallback, useRef } from "react";

// debounce (rate limit) value
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// get bounding box of element
export const useBbox = () => {
  const element = useRef();
  const [bbox, setBbox] = useState({});

  useEffect(() => {
    if (!element.current) return;
    const observer = new ResizeObserver(() =>
      setBbox(element.current.getBoundingClientRect())
    );
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);

  return [element, bbox];
};

// get fitted view box of svg
export const useViewBox = (padding = 0) => {
  const svg = useRef();

  const setViewBox = useCallback(() => {
    // if svg not mounted yet, exit
    if (!svg.current) return;
    // get bbox of content in svg
    const { x, y, width, height } = svg.current.getBBox();
    // set view box to bbox, essentially fitting view to content
    const viewBox = [
      x - padding,
      y - padding,
      width + padding * 2,
      height + padding * 2,
    ]
      .map((v) => Math.round(v))
      .join(" ");

    svg.current.setAttribute("viewBox", viewBox);
  }, [padding]);

  return [svg, setViewBox];
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

// unique id for component instance
let count = 0;
export const useUid = (prefix) => {
  const [id] = useState(() => prefix + "-" + count++);
  return id;
};
