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
  pinnedColor: string;
  backgroundImage: string;
  showFavicon: boolean;
  themeMode: ThemeMode;
}

export const defaultSettings: ZenTabSettings = {
  pinnedColor: "#0060df",
  backgroundImage: "",
  showFavicon: true,
  themeMode: "system",
};

export const darkModeSettings: Partial<ZenTabSettings> = {
  pinnedColor: "#4a9eff",
};
