import { StrictMode } from "react";
import { render } from "react-dom";
import Url from "./Url";
import App from "./App";

render(
  <StrictMode>
    <Url>
      <App />
    </Url>
  </StrictMode>,
  document.getElementById("root")
);
