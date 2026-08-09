import { loadSettings } from "../utils";
import { getPageAppearance } from "./appearance";

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await loadSettings();

  // Set up theme
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const appearance = getPageAppearance(settings, prefersDark);
  document.body.setAttribute("data-theme", appearance.theme);
  document.documentElement.style.setProperty(
    "--accent-color",
    appearance.accentColor
  );

  // Add system theme listener if needed
  if (settings.themeMode === "system") {
    const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const themeHandler = (e: MediaQueryListEvent) => {
      const theme = getPageAppearance(settings, e.matches).theme;
      document.body.setAttribute("data-theme", theme);
    };
    themeQuery.addEventListener("change", themeHandler);
  }

  // Apply background image if available
  if (appearance.backgroundImage) {
    document.body.style.backgroundImage = `url(${appearance.backgroundImage})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
  } else {
    document.body.style.backgroundImage = "none";
  }
});
