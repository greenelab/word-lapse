import { useState, useEffect, useCallback, useRef } from "react";

// debounce (rate limit) value
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// get fitted view box of svg
export const useViewBox = () => {
  const svg = useRef();
  const [viewBox, setViewBox] = useState(undefined);

  const getViewBox = useCallback(() => {
    // if svg not mounted yet, exit
    if (!svg.current) return;
    // get bbox of content in svg
    const { x, y, width, height } = svg.current.getBBox();
    // set view box to bbox, essentially fitting view to content
    setViewBox([x, y, width, height].join(" "));
  }, []);

  useEffect(() => {
    getViewBox();
  });

  return [svg, viewBox];
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
