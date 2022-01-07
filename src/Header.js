import Title from "./Title";
import Search from "./Search";
import "./Header.css";

const Header = () => {
  return (
    <header>
      {/* for accessibility */}
      <h1 style={{ display: "none" }}>Word Lapse</h1>
      <Title />
      <div className="subtitle">How does a word change in meaning over time?</div>
      <Search />
    </header>
  );
};

export default Header;
