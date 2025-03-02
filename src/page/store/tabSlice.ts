import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { TabInfo, TabGroup as ITabGroup, Mode, SearchMode } from "../types";
import { loadSettings } from "../utils";

interface TabState {
  searchQuery: string;
  selectedIndex: number | null;
  tabGroups: ITabGroup[];
  searchMode: SearchMode;
  showFavicon: boolean;
  availableModes: Mode[];
  isTransitioning: boolean;
}

const modes: Mode[] = [
  { id: "normal", label: "Tabs" },
  { id: "pinned", label: "Pinned" },
  { id: "audible", label: "Audible" },
  { id: "history", label: "History" },
];

const initialState: TabState = {
  searchQuery: "",
  selectedIndex: null,
  tabGroups: [],
  searchMode: "normal",
  showFavicon: true,
  availableModes: modes,
  isTransitioning: false,
};

const matchesSearch = (item: TabInfo, query: string): boolean => {
  const searchStr = query.toLowerCase();
  return (
    !!item.title?.toLowerCase().includes(searchStr) ||
    !!item.url?.toLowerCase().includes(searchStr)
  );
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) {
    return "Today";
  } else if (date >= yesterday) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

const getVisitTime = (item: TabInfo): number => {
  return "lastVisitTime" in item
    ? item.lastVisitTime || Date.now()
    : Date.now();
};

const groupTabs = (
  items: TabInfo[],
  searchQuery: string,
  searchMode: SearchMode
): ITabGroup[] => {
  const grouping: Record<string, TabInfo[]> = {};

  items.forEach((item) => {
    if (!item.url || !item.title) return;

    if (searchQuery && !matchesSearch(item, searchQuery)) return;

    let groupKey: string;
    if (searchMode === "history" && "lastVisitTime" in item) {
      const visitDate = new Date(item.lastVisitTime || Date.now());
      groupKey = formatDate(visitDate);
    } else {
      const url = new URL(item.url);
      groupKey = url.hostname;
    }

    if (!grouping[groupKey]) {
      grouping[groupKey] = [];
    }
    grouping[groupKey].push(item);
  });

  const groups = Object.entries(grouping).map(([title, tabs]) => ({
    title,
    tabs,
  }));

  if (searchMode === "history") {
    const dateOrder = ["Today", "Yesterday"];
    return groups.sort((a, b) => {
      const aIndex = dateOrder.indexOf(a.title);
      const bIndex = dateOrder.indexOf(b.title);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return getVisitTime(b.tabs[0]) - getVisitTime(a.tabs[0]);
    });
  }

  return groups.sort((a, b) => a.title.localeCompare(b.title));
};

export const loadInitialSettings = createAsyncThunk(
  "tabs/loadInitialSettings",
  async () => {
    const settings = await loadSettings();
    return settings;
  }
);

export const updateTabs = createAsyncThunk(
  "tabs/updateTabs",
  async (_, { getState }) => {
    const state = getState() as { tabs: TabState };
    const { searchQuery, searchMode } = state.tabs;

    const [currentTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const allTabs = await browser.tabs.query({});

    let items: TabInfo[] = [];

    if (searchMode === "history") {
      if (searchQuery) {
        const historyItems = await browser.history.search({
          text: searchQuery,
          startTime: 0,
          maxResults: 100,
        });
        items = historyItems;
      }
    } else {
      items = allTabs.filter((tab) => tab.id !== currentTab.id);

      // Apply mode-specific filters
      switch (searchMode) {
        case "normal":
          items = items.filter((tab) => !tab.incognito && !tab.pinned);
          break;
        case "pinned":
          items = items.filter((tab) => tab.pinned);
          break;
        case "audible":
          items = items.filter((tab) => tab.audible);
          break;
      }
    }

    return groupTabs(items, searchQuery, searchMode);
  }
);

const tabSlice = createSlice({
  name: "tabs",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedIndex: (state, action: PayloadAction<number | null>) => {
      state.selectedIndex = action.payload;
    },
    setSearchMode: (state, action: PayloadAction<SearchMode>) => {
      state.searchMode = action.payload;
    },
    setIsTransitioning: (state, action: PayloadAction<boolean>) => {
      state.isTransitioning = action.payload;
    },
    clearTabGroups: (state) => {
      state.tabGroups = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadInitialSettings.fulfilled, (state, action) => {
        state.showFavicon = action.payload.showFavicon;
        state.availableModes = action.payload.enableHistorySearch
          ? modes
          : modes.filter((m) => m.id !== "history");
      })
      .addCase(updateTabs.fulfilled, (state, action) => {
        state.tabGroups = action.payload;
        state.selectedIndex = null;
      });
  },
});

export const {
  setSearchQuery,
  setSelectedIndex,
  setSearchMode,
  setIsTransitioning,
  clearTabGroups,
} = tabSlice.actions;

export default tabSlice.reducer;
