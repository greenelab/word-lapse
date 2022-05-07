import {
  omitBy,
  isEmpty,
  mapValues,
  values,
  map,
  filter,
  find,
  matches,
  flatMap,
  uniqBy,
  orderBy,
} from "lodash";
import { sleep } from "./util/debug";

// api endpoint base url
// const api = "https://word-lapse-beta.ddns.net"; // for testing
const api = "https://api-wl.greenelab.com";

// get metadata from api
export const getMetadata = async () => {
  try {
    const meta = await (await window.fetch(api)).json();
    if (meta?.config?.CORPORA_SET)
      meta.config.CORPORA_SET = Object.values(meta.config.CORPORA_SET);
    return meta;
  } catch (error) {
    return {};
  }
};

// api call to see if cached
export const getCached = async (query, corpus) => {
  // nothing searched
  if (!query.trim() || !corpus.trim()) throw new Error(statuses.empty);
  // make request
  const url = `${api}/neighbors/cached?tok=${query}&corpus=${corpus}`;
  const { is_cached = false } = await (await window.fetch(url)).json();
  return is_cached;
};

// singleton to hold latest request
let latest = null;

// api call to get results
export const getResults = async (query, corpus) => {
  // unique id for this request
  const id = window.performance.now();
  latest = id;

  // nothing searched
  if (!query.trim() || !corpus.trim()) throw new Error(statuses.empty);

  // leave this in to briefly show that we are loading cached results
  // and because there is a study that if something complex takes a very
  // short time, users think it didn't work correctly
  await sleep(1000);

  // make request
  const url = `${api}/neighbors?tok=${query}&corpus=${corpus}`;
  const response = await window.fetch(url);
  if (!response.ok) throw new Error("Response not OK");
  const results = await response.json();

  // api error
  if ((results?.detail || [])[0]?.msg) throw new Error(results.detail[0].msg);

  // delete empty years
  results.neighbors = omitBy(results.neighbors, isEmpty);

  // transform/compute data
  results.neighbors = mapValues(results.neighbors, (neighbors) =>
    map(neighbors, ({ token, tag_id }) => ({
      // plain text word
      word: token,
      // tag string
      tag: tag_id,
      // tagged boolean
      tagged: !!tag_id,
      // how many years word appears in
      count: filter(values(results.neighbors), (yearNeighbors) =>
        find(yearNeighbors, matches({ token }))
      ).length,
    }))
  );

  // get a de-duped, sorted list of unique neighbors
  results.uniqueNeighbors = orderBy(
    uniqBy(flatMap(results.neighbors, values), "word"),
    ["count", "word"],
    ["desc", "asc"]
  );

  console.info(results);

  // by the time we're done with the above, another request may have been made.
  // only return results if this request is latest request.
  if (id === latest) return { query, ...results };
  else throw new Error(statuses.stale);
};

// get autocomplete results
export const getAutocomplete = async (query) => {
  try {
    // nothing searched
    if (!query.trim()) throw new Error(statuses.empty);

    // make request
    const url = `${api}/autocomplete?prefix=${query}`;
    const response = await window.fetch(url);
    if (!response.ok) throw new Error("Response not OK");

    // format results
    const results = await response.json();
    results.sort((a, b) => a.vocab?.length - b.vocab?.length);

    return results;
  } catch (error) {
    return [];
  }
};

// distinct search states
export const statuses = {
  empty: "empty", // user hasn't searched yet
  loadingCached: "loadingCached", // cached results are fetching
  loading: "loading", // uncached results are fetching
  stale: "stale", // results superseded by newer query
  // else: error fetching results
};
