import { sleep } from "./util/debug";
import fixture from "./data/api-fixture.json";

// singleton to hold latest request
let latest = null;

// api call to get results
export const getResults = async (query) => {
  // random unique id for this request
  const id = window.performance.now();
  latest = id;

  // PLACEHOLDER STUFF FOR TESTING
  if (query === "error") throw new Error("Random test error");
  if (query === "wait") await sleep(10000);
  fixture.timeline.forEach((entry) => (entry.frequency *= Math.random()));
  const results = fixture;

  // only return results if this request is latest request
  if (id === latest) return { query, ...results };
  else throw new Error(statuses.old);
};

// distinct search states
export const statuses = {
  empty: "empty", // user hasn't searched yet
  loading: "loading", // results are fetching
  success: "success", // results fetched successfully
  old: "old", // results superseded by newer query
  // else: error fetching results
};
