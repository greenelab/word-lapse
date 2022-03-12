import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";

// debounce (rate limit) value
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);
  return debouncedValue;
};

// get bounding box of element
export const useBbox = () => {
  const element = useRef();
  const [bbox, setBbox] = useState({});

  // attach resize observer
  useLayoutEffect(() => {
    if (!element.current) return;
    const observer = new ResizeObserver(() =>
      setBbox(element.current?.getBoundingClientRect() || {})
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
    // if svg not mounted yet (or anymore), exit
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

// unique id for component instance
let count = 0;
export const useUid = (prefix) => {
  const [id] = useState(() => prefix + "-" + count++);
  return id;
};
