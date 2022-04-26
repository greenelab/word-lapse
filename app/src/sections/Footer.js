import "./Footer.css";
import { meta } from "../";

const Footer = () => (
  <footer>
    {meta?.cache?.cached_entries && (
      <span>
        Results for {meta.cache.cached_entries.toLocaleString()} words already
        pre-computed!
      </span>
    )}

    <span>
      <a href="https://github.com/greenelab/word-lapse">
        View source, docs, license, etc. on GitHub
      </a>
    </span>

    <span>
      Project of the{" "}
      <a href="https://medschool.cuanschutz.edu/ai">Center for Health AI</a> and
      the <a href="https://greenelab.com/">Greene Lab</a>
    </span>
  </footer>
);

export default Footer;
