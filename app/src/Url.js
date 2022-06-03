import { useEffect, useReducer } from "react";
import { createBrowserHistory } from "history";
import { QueryParamProvider } from "use-query-params";

// browser history object
export const history = createBrowserHistory();

const Url = ({ children }) => {
  // https://github.com/pbeshai/use-query-params/blob/master/examples/no-router/src/App.js
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    history.listen(() => {
      forceUpdate();
      updateTitleBar();
    });
    updateTitleBar();
  }, []);

  return <QueryParamProvider history={history}>{children}</QueryParamProvider>;
};

export default Url;

// update title bar to reflect url state
const updateTitleBar = () => {
  const { search, year, yearA, yearB } = Object.fromEntries(
    new URLSearchParams(window.location.search)
  );
  document.title = [
    process.env.REACT_APP_TITLE,
    search ? `"${search}"` : "",
    year ? year : "",
    yearA && yearB ? `${yearA} vs. ${yearB}` : "",
  ]
    .filter((part) => part)
    .join(" · ");
};
