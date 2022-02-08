import RCSlider from "rc-slider";
import { useEffect } from "react";
import { useBbox } from "../util/hooks";
import { spacedRange } from "../util/math";
import "./Slider.css";

// number range slider
const Slider = ({ value, onChange, steps, tooltip }) => {
  const [element, bbox] = useBbox();
  const { width = 1000 } = bbox;

  // slider marks
  const n = Math.max(2, Math.floor(width / 50));
  const marks = {};
  for (const i of spacedRange(n, steps.length - 1)) marks[i] = steps[i];

  useEffect(() => {
    element?.current
      ?.querySelector(".rc-slider-handle")
      ?.setAttribute("data-tooltip", tooltip);
  }, [element, tooltip]);

  return (
    <div ref={element} className="slider">
      <RCSlider
        value={value}
        onChange={onChange}
        marks={marks}
        min={0}
        max={steps.length - 1}
        step={1}
      />
    </div>
  );
};

export default Slider;
