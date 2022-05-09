import { useState, useCallback, useRef, useLayoutEffect } from "react";

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

// set fitted view box of svg
export const useViewBox = (padding = 0) => {
  // reference to attach to svg element
  const svg = useRef();

  // function to call to set fitted viewbox on svg
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
    svg.current.style.aspectRatio = width + " / " + height;
  }, [padding]);

  return [svg, setViewBox];
};

// unique id for component instance
let count = 0;
export const useUid = (prefix) => {
  const [id] = useState(() => prefix + "-" + count++);
  return id;
};
