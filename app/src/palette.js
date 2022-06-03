import { library } from "@fortawesome/fontawesome-svg-core";
import * as fas from "@fortawesome/free-solid-svg-icons";
import { blendColors } from "./util/math";

// common palette of styles

// dimensions
const page = "1400px";
const pagePadding = `40px max(40px, calc((100vw - ${page}) / 2))`;
const pagePaddingSmall = `20px max(20px, calc((100vw - ${page}) / 2))`;

// colors
// https://tailwindcss.com/docs/customizing-colors
const offWhite = "#f3f4f6";
const lightGray = "#e5e7eb";
const gray = "#6b7280";
const darkGray = "#4b5563";
// https://www.materialpalette.com/colors
const red = "#e91e63";
const blue = "#03a9f4";
const purple = blendColors("#000000", blendColors(red, blue, 0.5), 0.66);
const lightPurple = blendColors("#ffffff", blendColors(red, blue, 0.5), 0.66);

// effects
const slow = "0.5s ease";
const fast = "0.2s ease";

// master list of variables
export {
  page,
  pagePadding,
  pagePaddingSmall,
  offWhite,
  lightGray,
  gray,
  darkGray,
  red,
  blue,
  purple,
  lightPurple,
  slow,
  fast,
};

// symbol to show next to tagged words to indicate they're tagged
// (keep in sync with google font import in index.html)
export const tagSymbol = "🞶";

// font awesome icons
library.add(
  fas.faAngleDown,
  fas.faBook,
  fas.faDownload,
  fas.faExclamationCircle,
  fas.faFont,
  fas.faHashtag,
  fas.faIcons,
  fas.faInfoCircle,
  fas.faLeftRight,
  fas.faPause,
  fas.faPercent,
  fas.faPlay,
  fas.faRightLong,
  fas.faSpinner
);
