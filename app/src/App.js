import { useState, createContext, useEffect } from "react";
import Header from "./sections/Header";
import Footer from "./sections/Footer";
import Results from "./sections/Results";
import Status from "./components/Status";
import "./components/tooltip";
import { getCached, getResults, statuses } from "./api";
import * as palette from "./palette";
import { setCssVariables } from "./util/dom";
import { useQueryState } from "./util/hooks";
import "./App.css";

// add all palette variables to document as CSS variables
setCssVariables(palette);

// context to conveniently pass down global/app-level vars
export const AppContext = createContext({});

const App = () => {
  const [results, setResults] = useState(null);
  const [search, setSearch] = useQueryState("search", "");
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
        // set title bar
        document.title = [process.env.REACT_APP_TITLE, search.trim()]
          .filter((w) => w)
          .join(" · ");

        // go into results mode
        setResults();
        setStatus();
        setFullscreen(false);

        // check if results for search already cached
        // and display appropriate loading status
        if (await getCached(search)) setStatus(statuses.loadingCached);
        else setStatus(statuses.loading);

        // perform query
        setResults(await getResults(search));
        setStatus();
      } catch (error) {
        // if not latest query
        if (error.message === statuses.stale) {
          // don't do anything, leaving most recent query to do its thing
          console.info(`Search "${search}" superceded`);
        } else {
          // set status message from thrown error
          setResults();
          setStatus(error.message);
          setFullscreen(error.message === statuses.empty);
        }
      }
    })();
  }, [search]);

  return (
    <AppContext.Provider
      value={{
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
