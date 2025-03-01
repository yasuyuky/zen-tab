import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { TabGroup } from './TabGroup';
import { TabInfo, TabGroup as ITabGroup, Mode, SearchMode } from '../types';
import {
  GlobalStyle,
  SearchContainer,
  SearchInner,
  SearchInput,
  ScrollContainer,
  TabGroupsContainer,
  ModeIndicator
} from '../styles';
import { loadSettings } from '../utils';

const modes: Mode[] = [
  { id: "normal", label: "Tabs" },
  { id: "pinned", label: "Pinned" },
  { id: "audible", label: "Audible" },
  { id: "history", label: "History" },
];

export const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTabId, setSelectedTabId] = useState<number | null>(null);
  const [tabGroups, setTabGroups] = useState<ITabGroup[]>([]);
  const [searchMode, setSearchMode] = useState<SearchMode>("normal");
  const [showFavicon, setShowFavicon] = useState(true);
  const [availableModes, setAvailableModes] = useState(modes);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const updateTabs = useCallback(async (query: string = "") => {
    const [currentTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const allTabs = await browser.tabs.query({});

    let items: TabInfo[] = [];

    if (searchMode === "history") {
      if (query) {
        const historyItems = await browser.history.search({
          text: query,
          startTime: 0,
          maxResults: 100,
        });
        items = historyItems;
      }
    } else {
      items = allTabs
        .filter((tab) => tab.id !== currentTab.id)
        .filter((tab) => {
          switch (searchMode) {
            case "normal":
              return !tab.incognito;
            case "pinned":
              return tab.pinned;
            case "audible":
              return tab.audible;
            default:
              return false;
          }
        });
    }

    const groups = groupTabs(items, query);
    setTabGroups(groups);
  }, [searchMode]);

  const groupTabs = useCallback((items: TabInfo[], searchQuery: string): ITabGroup[] => {
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
  }, [searchMode]);

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
    return "lastVisitTime" in item ? item.lastVisitTime || Date.now() : Date.now();
  };

  const matchesSearch = (item: TabInfo, query: string): boolean => {
    const searchStr = query.toLowerCase();
    return (
      !!item.title?.toLowerCase().includes(searchStr) ||
      !!item.url?.toLowerCase().includes(searchStr)
    );
  };

  const isBrowserTab = (tab: TabInfo): tab is browser.tabs.Tab & { id: number; windowId: number } => {
    return typeof tab.id === 'number' && typeof tab.windowId === 'number';
  };

  const handleSelectTab = async (tab: TabInfo) => {
    if (searchMode === "history") {
      if (tab.url) {
        await browser.tabs.create({ url: tab.url });
        window.close();
      }
    } else if (isBrowserTab(tab)) {
      await browser.tabs.update(tab.id, { active: true });
      await browser.windows.update(tab.windowId, { focused: true });
      window.close();
    }
  };

  const handleCloseTab = async (tab: TabInfo) => {
    if (searchMode === "history" && tab.url) {
      await browser.history.deleteUrl({ url: tab.url });
    } else if (isBrowserTab(tab)) {
      await browser.tabs.remove(tab.id);
    }
    await updateTabs(searchQuery);
  };

  const handleCloseGroup = async (group: ITabGroup) => {
    const promises = group.tabs.map(tab => {
      if (searchMode === "history" && tab.url) {
        return browser.history.deleteUrl({ url: tab.url });
      } else if (isBrowserTab(tab) && !tab.pinned) {
        return browser.tabs.remove(tab.id);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
    await updateTabs(searchQuery);
  };

  const toggleSearchMode = useCallback(() => {
    const currentIndex = availableModes.findIndex(({ id }) => id === searchMode);
    const nextIndex = (currentIndex + 1) % availableModes.length;
    console.log(searchMode, availableModes, currentIndex, nextIndex, availableModes[nextIndex].id);
    setSearchMode(availableModes[nextIndex].id);
  }, [availableModes, searchMode]);

  useEffect(() => {
    const init = async () => {
      const settings = await loadSettings();
      setShowFavicon(settings.showFavicon);
      const newAvailableModes = settings.enableHistorySearch ? modes : modes.filter(m => m.id !== "history");
      setAvailableModes(newAvailableModes);

      // Wait for state update to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      const handleVisibilityChange = () => {
        if (document.hidden) window.close();
      };

      const handleKeyDown = (e: Event) => {
        if (e instanceof KeyboardEvent) {
          if (e.key === "Escape") {
            window.close();
          } else if (e.key === "Tab" && newAvailableModes.length > 0) {
            e.preventDefault();
            toggleSearchMode();
          }
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      document.addEventListener("keydown", handleKeyDown);

      updateTabs();

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        document.removeEventListener("keydown", handleKeyDown);
      };
    };

    init();
  }, [toggleSearchMode, updateTabs]);

  useEffect(() => {
    updateTabs(searchQuery);
  }, [searchQuery, searchMode]);

  return (
    <>
      <GlobalStyle />
      <SearchContainer>
        <SearchInner>
          <ModeIndicator>
            {availableModes.map(({ id, label }) => (
              <span
                key={id}
                className={searchMode === id ? "current-mode" : ""}
                onClick={() => setSearchMode(id)}
              >
                {label}
              </span>
            ))}
          </ModeIndicator>
          <SearchInput
            ref={searchInputRef}
            type="text"
            placeholder="Search tabs..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </SearchInner>
      </SearchContainer>
      <ScrollContainer>
        <TabGroupsContainer>
          {tabGroups.map((group) => (
            <TabGroup
              key={group.title}
              group={group}
              showFavicon={showFavicon}
              selectedTabId={selectedTabId}
              isHistory={searchMode === "history"}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
              onCloseGroup={() => handleCloseGroup(group)}
            />
          ))}
        </TabGroupsContainer>
      </ScrollContainer>
    </>
  );
};
