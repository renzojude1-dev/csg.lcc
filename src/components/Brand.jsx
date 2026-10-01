import { Link } from "react-router-dom";
import { LOGO_PATH } from "../lib/helpers";

export default function Brand() {
  return (
    <Link
      to="/"
      className="brand"
      aria-label="Central Student Government home"
    >
      <img
        src={LOGO_PATH}
        alt="Central Student Government logo"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />

      <div>
        <strong>Central Student Government</strong>
        <span>Lipa City Colleges</span>
      </div>
    </Link>
  );
}