// split string by lower to upper case and letter to number
// and convert to lower case
export const split = (string) =>
  string
    .replace(/[^a-zA-Z0-9]/g, " ") // replace any non-alphanumeric with space
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word);

// convert camelCase, underscore_case, and dash-case to Human Case
export const toHumanCase = (string) =>
  split(string)
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
    .join(" ");
