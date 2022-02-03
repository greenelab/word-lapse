import { useContext } from "react";
import Title from "./Title";
import Search from "./Search";
import { AppContext } from "./App";
import "./Header.css";
import Matrix from "./Matrix";

const Header = () => {
  const { fullscreen } = useContext(AppContext);

  return (
    <header data-fullscreen={fullscreen}>
      {fullscreen && (
        <>
          <Matrix />
          <Matrix />
          <Matrix />
          <Matrix />
          <Matrix />
          <Matrix />
          <Matrix />
          <Matrix />
          <Matrix />
        </>
      )}
      <Title />
      <Search />
    </header>
  );
};

export default Header;
