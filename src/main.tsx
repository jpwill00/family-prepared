import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "@/styles/index.css";
import App from "@/App";

// Service worker registration — ONLY here, never in other files
registerSW({ onNeedRefresh() {} });

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
