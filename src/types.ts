import type browser from "webextension-polyfill";

export interface TabGroup {
  title: string;
  tabs: browser.Tabs.Tab[];
}

export interface TabGrouping {
  [key: string]: browser.Tabs.Tab[];
}

export interface TabSearch {
  query: string;
  groups: TabGroup[];
}
