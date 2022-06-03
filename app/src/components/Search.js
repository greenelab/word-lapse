import { useContext } from "react";
import { getAutocomplete } from "../api";
import { AppContext } from "../App";
import Combobox from "./Combobox";
import "./Search.css";
import Select from "./Select";

const description = process.env.REACT_APP_DESCRIPTION;

// search box
const Search = () => {
  const { meta, search, setSearch, corpus, setCorpus } = useContext(AppContext);

  if (!meta.corpora) return <div>Couldn't load corpora</div>;

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
          options={meta.corpora}
          value={corpus}
          onChange={setCorpus}
          data-tooltip={`Select corpus to use in analysis.<br/>Using "${corpus}".`}
        />
      </div>
      <div className="search-label">{description}</div>
    </>
  );
};

export default Search;
