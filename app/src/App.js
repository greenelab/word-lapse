import { useState, createContext, useEffect } from "react";
import { StringParam, withDefault, useQueryParam } from "use-query-params";
import Header from "./sections/Header";
import Footer from "./sections/Footer";
import Results from "./sections/Results";
import Status from "./components/Status";
import "./components/tooltip";
import { getCached, getMetadata, getResults, statuses } from "./api";
import * as palette from "./palette";
import { setCssVariables } from "./util/dom";
import "./App.css";

// add all palette variables to document as CSS variables
setCssVariables(palette);

// context to conveniently pass down global/app-level vars
export const AppContext = createContext({});

// root app
const App = () => {
  // global app state
  const [meta, setMeta] = useState({});
  const [corpus, setCorpus] = useQueryParam(
    "corpus",
    withDefault(StringParam, meta.corpora?.[0] || "")
  );
  const [results, setResults] = useState(null);
  const [search = "", setSearch] = useQueryParam("search", StringParam);
  const [status, setStatus] = useState(statuses.empty);
  const [fullscreen, setFullscreen] = useState(true);

  // load metadata on first render
  useEffect(() => {
    getMetadata().then(setMeta);
  }, []);

  // scroll to top when fullscreen set to true
  useEffect(() => {
    if (fullscreen) window.scrollTo(0, 0);
  }, [fullscreen]);

  // when search query changes
  useEffect(() => {
    let latest = true;
    (async () => {
      try {
        // go into results mode
        setResults();
        setStatus();
        setFullscreen(false);

        // check if results for search already cached
        // and display appropriate loading status
        const cached = await getCached(search, corpus);
        if (!latest) return;
        if (cached) setStatus(statuses.loadingCached);
        else setStatus(statuses.loading);

        // perform query
        const results = await getResults(search, corpus);
        if (!latest) return;
        setResults(results);
        setStatus();
      } catch (error) {
        console.error(error);
        // set status message from thrown error
        setResults();
        setStatus(error.message);
        setFullscreen(error.message === statuses.empty);
      }
    })();

    return () => (latest = false);
  }, [corpus, search]);

  return (
    <AppContext.Provider
      value={{
        meta,
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
