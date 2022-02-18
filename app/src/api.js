import { getUnique } from "./util/neighbors";
import { sleep } from "./util/debug";

// singleton to hold latest request
let latest = null;

// api endpoint base url
const api = "https://api-wl.greenelab.com";

// api call to see if cached
export const getCached = async (query) => {
  // make request
  const url = `${api}/neighbors/cached?tok=${query}`;
  try {
    const { is_cached = false } = await (await window.fetch(url)).json();
    return is_cached;
  } catch (error) {
    return false;
  }
};

// api call to get results
export const getResults = async (query) => {
  // unique id for this request
  const id = window.performance.now();
  latest = id;

  const url = `${api}/neighbors?tok=${query}`;
  try {
    // leave this in to briefly show that we are loading cached results
    // and because there is a study that if something complex takes a very
    // short time, users think it didn't work correctly
    await sleep(1000);

    // make request
    const response = await window.fetch(url);
    if (!response.ok) throw new Error("Response not OK");

    const results = await response.json();
    if (results?.detail?.msg) throw new Error(results.detail.msg);

    // transform data as needed
    results.changepoints = results.changepoints.map(({ changepoint_idx }) =>
      changepoint_idx.split("-")
    );
    for (const [key, value] of Object.entries(results.neighbors))
      if (!value.length) delete results.neighbors[key];

    // get computed data
    results.uniqueNeighbors = getUnique(results.neighbors);

    // only return results if this request is latest request
    if (id === latest) return { query, ...results };
    else throw new Error(statuses.old);
  } catch (error) {
    throw error;
  }
};

// distinct search states
export const statuses = {
  empty: "empty", // user hasn't searched yet
  loadingCached: "loadingCached", // cached results are fetching
  loading: "loading", // uncached results are fetching
  success: "success", // results fetched successfully
  old: "old", // results superseded by newer query
  // else: error fetching results
};
