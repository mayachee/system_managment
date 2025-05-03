import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./hooks/use-theme";
import { StrictMode } from "react";

// For debugging theme issues
const storedTheme = localStorage.getItem("ui-theme");
console.log("Stored theme at startup:", storedTheme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <App />
    </ThemeProvider>
  </StrictMode>
);
