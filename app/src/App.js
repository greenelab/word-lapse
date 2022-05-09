import { useState, createContext, useEffect, useReducer } from "react";
import { StringParam, withDefault, useQueryParam } from "use-query-params";
import Header from "./sections/Header";
import Footer from "./sections/Footer";
import Results from "./sections/Results";
import Status from "./components/Status";
import "./components/tooltip";
import { getCached, getResults, statuses } from "./api";
import * as palette from "./palette";
import { setCssVariables } from "./util/dom";
import { history, meta } from ".";
import "./App.css";

// add all palette variables to document as CSS variables
setCssVariables(palette);

// context to conveniently pass down global/app-level vars
export const AppContext = createContext({});

const App = () => {
  const [corpus, setCorpus] = useQueryParam(
    "corpus",
    withDefault(StringParam, meta?.config?.CORPORA_SET?.[0] || "")
  );
  const [results, setResults] = useState(null);
  const [search = "", setSearch] = useQueryParam("search", StringParam);
  const [status, setStatus] = useState(statuses.empty);
  const [fullscreen, setFullscreen] = useState(true);

  // scroll to top when fullscreen set to true
  useEffect(() => {
    if (fullscreen) window.scrollTo(0, 0);
  }, [fullscreen]);

  // when search query changes
  useEffect(() => {
    (async () => {
      try {
        // go into results mode
        setResults();
        setStatus();
        setFullscreen(false);

        // check if results for search already cached
        // and display appropriate loading status
        if (await getCached(search, corpus)) setStatus(statuses.loadingCached);
        else setStatus(statuses.loading);

        // perform query
        setResults(await getResults(search, corpus));
        setStatus();
      } catch (error) {
        console.error(error);
        // if not latest query
        if (error.message === statuses.stale) {
          // don't do anything, leaving most recent query to do its thing
        } else {
          // set status message from thrown error
          setResults();
          setStatus(error.message);
          setFullscreen(error.message === statuses.empty);
        }
      }
    })();
  }, [corpus, search]);

  // https://github.com/pbeshai/use-query-params/blob/master/examples/no-router/src/App.js
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    history.listen(() => {
      forceUpdate();
      updateTitleBar();
    });
    updateTitleBar();
  }, []);

  return (
    <AppContext.Provider
      value={{
        corpus,
        setCorpus,
        results,
        setResults,
        search,
        setSearch,
        status,
        fullscreen,
      }}
    >
      <Header />
      <main>
        <Status />
        <Results />
      </main>
      <Footer />
    </AppContext.Provider>
  );
};

export default App;

// update title bar to reflect url state
const updateTitleBar = () => {
  const { search, year, yearA, yearB } = Object.fromEntries(
    new URLSearchParams(window.location.search)
  );
  document.title = [
    process.env.REACT_APP_TITLE,
    search ? `"${search}"` : "",
    year ? year : "",
    yearA && yearB ? `${yearA} vs. ${yearB}` : "",
  ]
    .filter((part) => part)
    .join(" · ");
};
