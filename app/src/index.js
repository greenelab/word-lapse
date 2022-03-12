import { StrictMode } from "react";
import { render } from "react-dom";
import { createBrowserHistory } from "history";
import { QueryParamProvider } from "use-query-params";
import App from "./App";

export const history = createBrowserHistory();

render(
  <StrictMode>
    <QueryParamProvider history={history}>
      <App />
    </QueryParamProvider>
  </StrictMode>,
  document.getElementById("root")
);
