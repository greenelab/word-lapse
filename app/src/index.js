import { StrictMode } from "react";
import { render } from "react-dom";
import { createBrowserHistory } from "history";
import { QueryParamProvider } from "use-query-params";
import App from "./App";
import { getMetadata } from "./api";

// browser history object˝
export const history = createBrowserHistory();

// global static object holding api metadata
export let meta = {};

const runApp = async () => {
  // get metadata from api
  meta = await getMetadata();

  // don't render until we have all metadata
  // makes url sync, corpora, etc much simpler
  render(
    <StrictMode>
      <QueryParamProvider history={history}>
        <App />
      </QueryParamProvider>
    </StrictMode>,
    document.getElementById("root")
  );
};

runApp();
