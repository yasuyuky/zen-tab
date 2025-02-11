export interface TabGroup {
  title: string;
  tabs: browser.tabs.Tab[];
}

export interface TabGrouping {
  [key: string]: browser.tabs.Tab[];
}

export interface TabSearch {
  query: string;
  groups: TabGroup[];
}

export type ThemeMode = "light" | "dark" | "system";

export interface ZenTabSettings {
  selectedColor: string;
  pinnedColor: string;
  hoverColor: string;
  backgroundImage: string;
  showFavicon: boolean;
  themeMode: ThemeMode;
}

export const defaultSettings: ZenTabSettings = {
  selectedColor: "#f0f0f0",
  pinnedColor: "#0060df",
  hoverColor: "#f0f0f0",
  backgroundImage: "",
  showFavicon: true,
  themeMode: "system",
};

export const darkModeSettings: Partial<ZenTabSettings> = {
  selectedColor: "#2b2b2b",
  pinnedColor: "#4a9eff",
  hoverColor: "#2b2b2b",
};
