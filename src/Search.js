import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Search.css";

const Search = () => {
  const [value, setValue] = useState("");

  const search = (event) => {
    event.preventDefault();
    if (value.trim())
      window.setTimeout(
        () =>
          document
            .querySelector("main")
            .scrollIntoView({ block: "start", behavior: "smooth" }),
        10
      );
  };

  return (
    <form onSubmit={search} className="form">
      <div>
        Explore how a word changes in meaning over time
      </div>
      <input
        className="search"
        value={value}
        onBlur={search}
        onChange={({ target }) => setValue(target.value)}
        placeholder="Type a word and press enter"
      />
      <button className="submit">
        <FontAwesomeIcon icon="angle-down" />
      </button>
    </form>
  );
};

export default Search;
