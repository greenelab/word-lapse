import Title from "./Title";
import Search from "./Search";
import "./Header.css";

const Header = () => {
  return (
    <header>
      {/* for accessibility */}
      <h1 style={{ display: "none" }}>Word Lapse</h1>
      <Title />
      <Search />
    </header>
  );
};

export default Header;
