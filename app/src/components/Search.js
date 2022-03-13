import { useContext } from "react";
import { getAutocomplete } from "../api";
import { AppContext } from "../App";
import { meta } from "..";
import Combobox from "./Combobox";
import "./Search.css";
import Select from "./Select";

// search box
const Search = () => {
  const { search, setSearch, corpus, setCorpus } = useContext(AppContext);

  return (
    <>
      <div className="search">
        <Combobox
          options={getAutocomplete}
          value={search}
          onChange={setSearch}
          placeholder="Type a word"
        />
        <Select
          options={meta?.config?.CORPORA_SET || []}
          value={corpus}
          onChange={setCorpus}
          data-tooltip="Select corpus to use in analysis"
        />
      </div>
      <div className="search-label">
        Explore how a word changes in meaning over time
      </div>
    </>
  );
};

export default Search;
