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
  accentColor: string;
  backgroundImage: string;
  showFavicon: boolean;
  themeMode: ThemeMode;
  enableHistorySearch: boolean;
}

export const defaultSettings: ZenTabSettings = {
  accentColor: "#0060df",
  backgroundImage: "",
  showFavicon: true,
  themeMode: "system",
  enableHistorySearch: false,
};
