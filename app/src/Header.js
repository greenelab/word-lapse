import { useContext } from "react";
import Title from "./Title";
import Search from "./Search";
import { AppContext } from "./App";
import "./Header.css";

const Header = () => {
  const { fullscreen } = useContext(AppContext);

  return (
    <header data-fullscreen={fullscreen}>
      <Title />
      <Search />
    </header>
  );
};

export default Header;
