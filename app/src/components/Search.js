import { useContext, useEffect, useState } from "react";
import { defaultCorpora, getCorpora } from "../api";
import { AppContext } from "../App";
import { useDebounce } from "../util/hooks";
import "./Search.css";

// search box
const Search = () => {
  const { search, setSearch, corpus, setCorpus } = useContext(AppContext);
  const [value, setValue] = useState(search);
  const debouncedValue = useDebounce(value, 3000);
  const [corpora, setState] = useState(defaultCorpora);

  // get available corpora
  useEffect(() => {
    (async () => setState(await getCorpora()))();
  }, []);

  // when user explicitly submits form by pressing enter
  const onSubmit = (event) => {
    // avoid navigating away from page
    event.preventDefault();
    // update search immediately
    setSearch(value);
  };

  // when user types
  useEffect(() => {
    // update search after debounce
    setSearch(debouncedValue);
  }, [setSearch, debouncedValue]);

  // when search changes upstream, update input value here
  useEffect(() => setValue(search), [search]);

  return (
    <form onSubmit={onSubmit} id="form">
      <div id="search">
        <input
          id="input"
          value={value}
          onChange={({ target }) => setValue(target.value)}
          placeholder="Enter a word"
          autoFocus
        />
        <select
          id="corpus"
          value={corpus}
          onChange={(event) => setCorpus(event.target.value)}
        >
          {corpora.map((corpus, index) => (
            <option key={index} value={corpus}>
              {corpus}
            </option>
          ))}
        </select>
      </div>
      <label id="search-label" htmlFor="search">
        Explore how a word changes in meaning over time
      </label>
    </form>
  );
};

export default Search;
