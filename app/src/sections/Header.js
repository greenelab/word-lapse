import { useContext } from "react";
import Title from "../components/Title";
import Search from "../components/Search";
import Matrix from "../components/Matrix";
import { AppContext } from "../App";
import "./Header.css";

const Header = () => {
  const { fullscreen } = useContext(AppContext);

  return (
    <header data-fullscreen={fullscreen}>
      {fullscreen && <Matrix />}
      <Title />
      <Search />
    </header>
  );
};

export default Header;
