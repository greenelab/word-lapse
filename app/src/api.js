import { getUnique } from "./util/neighbors";
import { sleep } from "./util/debug";

// api endpoint base url
const api = "https://api-wl.greenelab.com";

// api call to see if cached
export const getCached = async (query) => {
  if (!query.trim()) throw new Error(statuses.empty);
  // make request
  const url = `${api}/neighbors/cached?tok=${query}`;
  try {
    const { is_cached = false } = await (await window.fetch(url)).json();
    return is_cached;
  } catch (error) {
    return false;
  }
};

// singleton to hold latest request
let latest = null;

// api call to get results
export const getResults = async (query) => {
  // unique id for this request
  const id = window.performance.now();
  latest = id;

  // nothing searched
  if (!query.trim()) throw new Error(statuses.empty);

  // leave this in to briefly show that we are loading cached results
  // and because there is a study that if something complex takes a very
  // short time, users think it didn't work correctly
  await sleep(1000);

  // make request
  const url = `${api}/neighbors?tok=${query}`;
  const response = await window.fetch(url);
  if (!response.ok) throw new Error("Response not OK");
  const results = await response.json();

  // api error
  if ((results?.detail || [])[0]?.msg) throw new Error(results.detail[0].msg);

  // transform data as needed
  for (const [key, value] of Object.entries(results.neighbors))
    if (!value.length) delete results.neighbors[key];

  // get computed data
  results.uniqueNeighbors = getUnique(results.neighbors);

  // by the time we're done with the above, another request may have been made.
  // only return results if this request is latest request.
  if (id === latest) return { query, ...results };
  else throw new Error(statuses.stale);
};

// distinct search states
export const statuses = {
  empty: "empty", // user hasn't searched yet
  loadingCached: "loadingCached", // cached results are fetching
  loading: "loading", // uncached results are fetching
  stale: "stale", // results superseded by newer query
  // else: error fetching results
};
