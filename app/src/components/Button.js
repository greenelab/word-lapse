import { forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Button.css";

const Button = forwardRef(({ text, icon, CustomIcon = () => <></>, ...props }, ref) => (
  <button ref={ref} {...props} data-square={icon && !text} className="button">
    <CustomIcon className="custom-icon" />
    {icon && <FontAwesomeIcon icon={icon} />}
    {text && <span>{text}</span>}
  </button>
));

export default Button;
