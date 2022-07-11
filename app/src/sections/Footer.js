import { useContext } from "react";
import { AppContext } from "../App";
import "./Footer.css";

const Footer = () => {
  const { meta } = useContext(AppContext);

  return (
    <footer>
      <span>
        Results for {meta.cached?.toLocaleString() || "???"} words already
        pre-computed!
      </span>

      <span>
        <a href="https://github.com/greenelab/word-lapse">
          View source, docs, license, etc. on GitHub
        </a>
      </span>

      <span>
        Project of the <a href="https://greenelab.com/">Greene Lab</a>
      </span>
    </footer>
  );
};

export default Footer;
