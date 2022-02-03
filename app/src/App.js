import { useState, createContext, useEffect } from "react";
import Header from "./sections/Header";
import Footer from "./sections/Footer";
import Results from "./sections/Results";
import Status from "./components/Status";
import { getResults, statuses } from "./api";
import * as palette from "./palette";
import { setCssVariables } from "./util/dom";
import { useQueryState } from "./util/hooks";
import "./icons";
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

  // when search query changes
  useEffect(() => {
    const run = async () => {
      // reset results and status
      setResults(null);
      setStatus(statuses.empty);

      // set title bar
      document.title = [process.env.REACT_APP_TITLE, search.trim()]
        .filter((w) => w)
        .join(" · ");

      // if search not empty
      if (search.trim()) {
        setFullscreen(false);
      }
      // if search empty
      else {
        window.scrollTo(0, 0);
        setFullscreen(true);
        return;
      }

      setStatus(statuses.loading);
      try {
        // perform query
        setResults(await getResults(search));
        setStatus(statuses.success);
      } catch (error) {
        if (error.message !== statuses.old) setStatus(error.message);
      }
    };

    run();
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
