import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Suprimir console.log en producción (mantener warn/error)
if (import.meta.env.PROD) {
  console.log = () => {};
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
