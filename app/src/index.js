import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Url from "./Url";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Url>
      <App />
    </Url>
  </StrictMode>
);
