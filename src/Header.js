import { useContext } from "react";
import Title from "./Title";
import Search from "./Search";
import "./Header.css";
import { AppContext } from "./App";

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
