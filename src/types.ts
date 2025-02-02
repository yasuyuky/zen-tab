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

export interface ZenTabSettings {
  selectedColor: string;
  pinnedColor: string;
  hoverColor: string;
}

export const defaultSettings: ZenTabSettings = {
  selectedColor: "#f0f0f0",
  pinnedColor: "#0060df",
  hoverColor: "#f0f0f0",
};
