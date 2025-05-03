import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./hooks/use-theme";
import { StrictMode } from "react";

// Force light theme
try {
  localStorage.setItem("ui-theme", "light");
} catch (e) {
  console.error("Could not set theme in localStorage", e);
}

const storedTheme = localStorage.getItem("ui-theme");
console.log("Stored theme at startup:", storedTheme);

// Force light mode on document element
document.documentElement.classList.remove("dark");
document.documentElement.classList.add("light");
document.documentElement.dataset.theme = "light";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <App />
    </ThemeProvider>
  </StrictMode>
);
