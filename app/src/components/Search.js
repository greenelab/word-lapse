import { useContext, useEffect, useState } from "react";
import { defaultCorpora, getAutocomplete, getCorpora } from "../api";
import { AppContext } from "../App";
import { useCombobox } from "downshift";
import "./Search.css";

// search box
const Search = () => {
  const { search, setSearch, corpus, setCorpus } = useContext(AppContext);
  const [value, setValue] = useState(search);
  const [corpora, setState] = useState(defaultCorpora);
  const [autocomplete, setAutocomplete] = useState([]);

  // autocomplete
  // https://github.com/downshift-js/downshift/tree/master/src/hooks/useCombobox
  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    closeMenu,
  } = useCombobox({
    items: autocomplete,
    inputValue: value,
    onInputValueChange: ({ inputValue }) => setValue(inputValue),
    onSelectedItemChange: () => setSearch(value),
  });

  // get available corpora
  useEffect(() => {
    (async () => setState(await getCorpora()))();
  }, []);

  // get autocomplete results
  useEffect(() => {
    (async () => {
      setAutocomplete(await getAutocomplete(value));
    })();
  }, [value]);

  // when user explicitly submits form by pressing enter
  const onSubmit = (event) => {
    // if autocomplete result highlighted, let downshift do its thing
    if (highlightedIndex !== -1) return;
    // avoid navigating away from page
    event.preventDefault();
    // update search immediately
    setSearch(value);
  };

  // when search changes upstream, update input value here
  useEffect(() => {
    setValue(search);
    closeMenu();
  }, [search, closeMenu]);

  return (
    <form onSubmit={onSubmit} className="form">
      <div className="form-controls">
        <div {...getComboboxProps()} className="search">
          <input
            {...getInputProps()}
            className="input"
            placeholder="Enter a word"
            autoFocus
          />
        </div>
        <div {...getMenuProps()} className="autocomplete">
          {isOpen && !!autocomplete.length && (
            <div>
              {autocomplete.map((item, index) => (
                <div
                  key={index}
                  {...getItemProps({ item, index })}
                  className="option"
                  data-highlighted={highlightedIndex === index}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
        <select
          className="corpus"
          value={corpus}
          onChange={(event) => setCorpus(event.target.value)}
          data-tooltip="What corpus to use in analysis"
        >
          {corpora.map((corpus, index) => (
            <option key={index} value={corpus}>
              {corpus}
            </option>
          ))}
        </select>
      </div>
      <label {...getLabelProps()} className="search-label" htmlFor="input">
        Explore how a word changes in meaning over time
      </label>
    </form>
  );
};

export default Search;
