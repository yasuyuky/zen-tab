import { loadSettings } from "./utils";

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await loadSettings();

  // Set up theme
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark =
    settings.themeMode === "dark" ||
    (settings.themeMode === "system" && prefersDark);
  document.body.setAttribute("data-theme", isDark ? "dark" : "light");

  // Add system theme listener if needed
  if (settings.themeMode === "system") {
    const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const themeHandler = (e: MediaQueryListEvent) => {
      document.body.setAttribute("data-theme", e.matches ? "dark" : "light");
    };
    themeQuery.addEventListener("change", themeHandler);
  }

  // Apply background image if available
  if (settings.backgroundImage) {
    document.body.style.backgroundImage = `url(${settings.backgroundImage})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
  } else {
    document.body.style.backgroundImage = "none";
  }
});
