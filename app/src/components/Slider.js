import RCSlider from "rc-slider";
import { range } from "lodash";
import { useEffect } from "react";
import { useBbox } from "../util/hooks";
import "./Slider.css";

// number range slider
const Slider = ({ value, onChange, steps, tooltip, label, ...rest }) => {
  const [element, bbox] = useBbox();

  // make slider marks

  // expected avg width of mark text
  const w = 35;
  // width of slider minus padding
  let { width = 1000 } = bbox;
  width -= 40; // minus padding

  // only take every n indices to fit marks without overlapping
  const n = Math.ceil((steps.length * w) / width);
  let r = range(0, steps.length, n);

  // if 2 or less marks, always include first and last
  if (r.length <= 2) r = [0, steps.length - 1];

  // format indices to object for rc-slider
  const marks = {};
  for (const i of r) marks[i] = steps[i];

  // update slider tooltip
  useEffect(() => {
    element?.current
      ?.querySelector(".rc-slider-handle")
      ?.setAttribute("data-tooltip", tooltip);
  }, [element, tooltip]);

  return (
    <div ref={element} className="slider" {...rest}>
      <RCSlider
        value={value}
        onChange={onChange}
        marks={marks}
        min={0}
        max={steps.length - 1}
        step={1}
        ariaValueTextFormatterForHandle={() => label}
      />
    </div>
  );
};

export default Slider;
