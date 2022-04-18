import { useContext } from "react";
import { getAutocomplete } from "../api";
import { AppContext } from "../App";
import { meta } from "..";
import Combobox from "./Combobox";
import "./Search.css";
import Select from "./Select";

const description = process.env.REACT_APP_DESCRIPTION;

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
          options={Object.values(meta?.config?.CORPORA_SET || {})}
          value={corpus}
          onChange={setCorpus}
          data-tooltip={`Select corpus to use in analysis. Using "${corpus}".`}
        />
      </div>
      <div className="search-label">{description}</div>
    </>
  );
};

export default Search;
