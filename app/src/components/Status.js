import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppContext } from "../App";
import { statuses } from "../api";
import "./Status.css";

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
  else if (status === statuses.loading)
    message = (
      <>
        <FontAwesomeIcon
          icon="spinner"
          className="fa-spin"
          style={{ color: "var(--gray)" }}
        />
        <span>Searching and loading results</span>
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

  return <div className="status">{message}</div>;
};

export default Status;
