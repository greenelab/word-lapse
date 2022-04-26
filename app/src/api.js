import { getUnique } from "./util/neighbors";
import { sleep } from "./util/debug";
import fixture from "./data/api-fixture.json";

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
  // const url = `${api}/neighbors?tok=${query}&corpus=${corpus}`;
  // const response = await window.fetch(url);
  // if (!response.ok) throw new Error("Response not OK");
  // const results = await response.json();
  const results = JSON.parse(JSON.stringify(fixture));

  // api error
  if ((results?.detail || [])[0]?.msg) throw new Error(results.detail[0].msg);

  // transform data as needed

  // delete empty years
  for (const [year, words] of Object.entries(results.neighbors))
    if (!words.length) delete results.neighbors[year];

  // create map for conveniently looking up whether a (plain string) word is tagged
  results.tags = {};
  for (const [, words] of Object.entries(results.neighbors))
    for (const { token, tag_id } of words) results.tags[token] = tag_id;

  // make year into array of plain string words (tokens) for easier visualizations
  for (const [year] of Object.entries(results.neighbors))
    results.neighbors[year] = results.neighbors[year].map(({ token }) => token);

  // rename some field names to be easier to work with in D3
  results.umap = results.umap.map((point) => ({
    ...point,
    x: point.umap_x_coord,
    y: point.umap_y_coord,
  }));

  // split umap data into searched word and neighbors
  results.umap = {
    trajectory: results.umap.filter((point) => point.token === query),
    neighbors: results.umap.filter((point) => point.token !== query),
  };

  // get computed data
  results.uniqueNeighbors = getUnique(results.neighbors);

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
