import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppContext } from "../App";
import { statuses } from "../api";
import "./Status.css";
import Matrix from "./Matrix";

// special status message for loading/error/etc
const Status = () => {
  const { status } = useContext(AppContext);

  // if successful, don't show status (show results instead)
  if (status === statuses.success) return <></>;

  let message;

  if (status === statuses.empty)
    message = (
      <>
        <FontAwesomeIcon icon="info-circle" style={{ color: "var(--gray)" }} />
        <span>Enter a word to see results</span>
      </>
    );
  else if (status === statuses.loadingCached)
    message = (
      <>
        <FontAwesomeIcon
          icon="spinner"
          className="fa-spin"
          style={{ color: "var(--gray)" }}
        />
        <span>Loading cached results.</span>
      </>
    );
  else if (status === statuses.loading)
    message = (
      <>
        <Matrix />
        <FontAwesomeIcon
          icon="spinner"
          className="fa-spin"
          style={{ color: "var(--gray)" }}
        />
        <span>
          No one has searched for this word yet!
          <br />
          Computing results. This might take a minute.
        </span>
      </>
    );
  // error
  else
    message = (
      <>
        <FontAwesomeIcon
          icon="exclamation-circle"
          style={{ color: "var(--red)" }}
        />
        <span>{status}</span>
      </>
    );

  return <div id="status">{message}</div>;
};

export default Status;
