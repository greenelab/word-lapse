import { forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Button.css";

const Button = forwardRef(({ text, icon, ...props }, ref) => (
  <button ref={ref} {...props} data-square={icon && !text} className="button">
    {icon && <FontAwesomeIcon icon={icon} />}
    {text && <span>{text}</span>}
  </button>
));

export default Button;
