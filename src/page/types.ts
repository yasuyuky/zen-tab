import browser from "webextension-polyfill";

export type TabInfo = (browser.Tabs.Tab | browser.History.HistoryItem) & {
  id?: number | string;
  windowId?: number;
  title?: string;
  url?: string;
  favIconUrl?: string;
  pinned?: boolean;
  audible?: boolean;
  incognito?: boolean;
  lastVisitTime?: number;
};

export interface TabGroup {
  title: string;
  tabs: TabInfo[];
}

export type SearchMode = "normal" | "pinned" | "audible" | "history";

export interface Mode {
  id: SearchMode;
  label: string;
}

export interface ZenTabSettings {
  themeMode: "light" | "dark" | "system";
  showFavicon: boolean;
  enableHistorySearch: boolean;
  backgroundImage?: string;
  accentColor: string;
}
