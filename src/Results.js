import { useContext } from "react";
import { AppContext } from "./App";

const Results = () => {
  const { results } = useContext(AppContext);
  if (results) return <pre>{JSON.stringify(results, null, 2)}</pre>;
  else return <></>;
};

export default Results;
