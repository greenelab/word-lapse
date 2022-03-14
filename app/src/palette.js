import { library } from "@fortawesome/fontawesome-svg-core";
import * as fas from "@fortawesome/free-solid-svg-icons";

// common palette of styles

// dimensions
const page = "1400px";
const pagePadding = `40px max(40px, calc((100vw - ${page}) / 2))`;
const pagePaddingSmall = `20px max(20px, calc((100vw - ${page}) / 2))`;

// colors
const lightGray = "#eceff1";
const gray = "#90a4ae";
const darkGray = "#455a64";
const red = "#e91e63";
const blue = "#03a9f4";
const purple = "#673ab7";
const lightPurple = "#d1c4e9";

// effects
const fast = "0.5s ease";

// master list of variables
export {
  page,
  pagePadding,
  pagePaddingSmall,
  lightGray,
  gray,
  darkGray,
  red,
  blue,
  purple,
  lightPurple,
  fast,
};

// font awesome icons
library.add(
  fas.faAngleDown,
  fas.faBook,
  fas.faDownload,
  fas.faExclamationCircle,
  fas.faFont,
  fas.faIcons,
  fas.faInfoCircle,
  fas.faLeftRight,
  fas.faPause,
  fas.faPlay,
  fas.faRightLong,
  fas.faSpinner
);
