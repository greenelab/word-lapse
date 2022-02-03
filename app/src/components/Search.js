import { useContext, useEffect, useState } from "react";
import { AppContext } from "../App";
import { useDebounce } from "../util/hooks";
import "./Search.css";

// search box
const Search = () => {
  const { search, setSearch } = useContext(AppContext);
  const [value, setValue] = useState(search);
  const debouncedValue = useDebounce(value, 1000);

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
      <input
        id="search"
        value={value}
        onChange={({ target }) => setValue(target.value)}
        placeholder="Enter a word"
        autoFocus
      />
      <label htmlFor="search">
        Explore how a word changes in meaning over time
      </label>
    </form>
  );
};

export default Search;
