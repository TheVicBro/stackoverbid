import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import CataloguePage from "./catalogue.tsx";
import AuthPage from "./pages/AuthPage.tsx";

function CatalogueRoute() {
  if (!localStorage.getItem("access_token")) {
    return <Navigate to="/auth" replace />;
  }

  return <CataloguePage />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/catalogue" element={<CatalogueRoute />} />
        <Route path="/" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
