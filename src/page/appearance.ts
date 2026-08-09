import type { ZenTabSettings } from "../settings";

export interface PageAppearance {
  theme: "light" | "dark";
  accentColor: string;
  backgroundImage: string;
}

export function getPageAppearance(
  settings: ZenTabSettings,
  prefersDark: boolean
): PageAppearance {
  const isDark =
    settings.themeMode === "dark" ||
    (settings.themeMode === "system" && prefersDark);

  return {
    theme: isDark ? "dark" : "light",
    accentColor: settings.accentColor,
    backgroundImage: settings.backgroundImage,
  };
}
