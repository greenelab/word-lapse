import fixture from "./api-fixture.json";

// singleton to hold latest request
let latest = null;

// api call to get results
// PLACEHOLDER
export const getResults = async (query) => {
  // random unique id for this request
  const id = window.performance.now();
  latest = id;

  // perform request
  await new Promise((resolve) => window.setTimeout(resolve, 1000));

  // only return results if this request is latest request
  if (id === latest) return { query, ...fixture };
  else throw new Error(statuses.old);
};

export const statuses = {
  empty: "empty", // user hasn't searched yet
  loading: "loading", // results are fetching
  error: "error", // error fetching results
  success: "success", // results fetched successfully
  old: "old", // results superseded by newer query
};
