// common stuff for neighbors charts

// alphabetical compare
const byAlphabetical = (a, b) => (a > b ? 1 : a < b ? -1 : 0);

// count how many years a word appears in neighbors
export const count = (word, neighbors) =>
  Object.values(neighbors).filter((year) => year.includes(word)).length;

// count compare
const byCount = (a, b, neighbors) => {
  a = count(a, neighbors);
  b = count(b, neighbors);
  return a > b ? -1 : a < b ? 1 : 0;
};

// sort compare func
const compare = (neighbors) => (a, b) =>
  byCount(a, b, neighbors) || byAlphabetical(a, b);

// get a de-duped, sorted list of unique neighbors
export const getUnique = (neighbors) =>
  Array.from(new Set(Object.values(neighbors).flat())).sort(compare(neighbors));
