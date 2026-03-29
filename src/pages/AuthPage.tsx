import { Navigate, useNavigate } from "react-router-dom";

import Authentication from "../authentication";

export default function AuthPage() {
  const navigate = useNavigate();

  if (localStorage.getItem("access_token")) {
    return <Navigate to="/" replace />;
  }

  return (
    <Authentication
      onAuthed={() => {
        navigate("/", { replace: true });
      }}
    />
  );
}
