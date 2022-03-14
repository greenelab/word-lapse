import "./Footer.css";
import { meta } from "../";

const Footer = () => {
  const {
    cache: { cached_entries },
  } = meta;

  return (
    <footer>
      <span>
        Results for {cached_entries.toLocaleString()} words already
        pre-computed!
      </span>

      <span>
        <a href="https://github.com/greenelab/word-lapse">
          View source, docs, license, etc. on GitHub
        </a>
      </span>

      <span>
        Project of the{" "}
        <a href="https://medschool.cuanschutz.edu/ai">Center for Health AI</a>{" "}
        and the <a href="https://greenelab.com/">Greene Lab</a>
      </span>
    </footer>
  );
};

export default Footer;
