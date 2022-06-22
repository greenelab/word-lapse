import { icon } from "@fortawesome/fontawesome-svg-core";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
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
const api = "https://api-wl.greenelab.com";

// get metadata from api
export const getMetadata = async () => {
  const meta = await (await window.fetch(api)).json();
  return {
    corpora: Object.values(meta?.config?.CORPORA_SET || {}),
    cached: meta?.cache?.cached_entries || "",
  };
};

// api call to see if cached
export const getCached = async (query, corpus) => {
  // nothing searched
  if (!query.trim() || !corpus.trim()) throw new Error(statuses.empty);
  const url = `${api}/neighbors/cached?tok=${query}&corpus=${corpus}`;
  const { is_cached = false } = await (await window.fetch(url)).json();
  return is_cached;
};

// api call to get results
export const getResults = async (query, corpus) => {
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
  if (results?.detail?.[0]?.msg) throw new Error(results.detail[0].msg);

  // transform frequency data
  results.frequency = results.frequency.map(
    ({ frequency, normalized_frequency, year }) => ({
      frequency,
      normalized: normalized_frequency,
      year,
    })
  );

  // delete empty years
  results.neighbors = omitBy(results.neighbors, isEmpty);

  // transform/compute neighbors data
  results.neighbors = mapValues(results.neighbors, (neighbors) =>
    map(neighbors, ({ token, tag_id, score }) => ({
      // plain text word
      word: token,
      // tag string
      tag: tag_id,
      // tagged boolean
      tagged: !!tag_id,
      // link to tag metadata
      tagLink: getTagLink(tag_id),
      // similarity score
      score: score.toFixed(2),
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

  // log resulting data
  console.info(results);

  return { query, ...results };
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
  // else: error fetching results
};

// get external link for tag metadata
const getTagLink = (tag) => {
  if (!tag) return "";

  // get parts of tag
  const prefix = tag.split("_").shift().toLowerCase();
  const id = tag.split("_").pop().toUpperCase();

  // map of links
  const links = {
    gene: "https://www.ncbi.nlm.nih.gov/gene/<id>",
    species:
      "https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=info&id=<id>",
    cellline: "https://web.expasy.org/cellosaurus/<id>",
    disease: "https://id.nlm.nih.gov/mesh/<id>",
    chemical: "https://id.nlm.nih.gov/mesh/<id>",
  };

  // find matching link
  const link = find(links, (value, key) => prefix === key)?.replace("<id>", id);

  // https://fontawesome.com/docs/apis/javascript/methods
  const extIcon = icon(faExternalLinkAlt, {
    styles: { "margin-left": "0.5em" },
  }).html;

  // return html to show
  return link
    ? `<a href="${link}" target="_blank">Metadata for ${tag.replaceAll(
        "_",
        " "
      )}${extIcon}</a>`
    : "Unknown tag type";
};
