import React, { useState, useEffect, useCallback, useRef, ChangeEvent, useMemo } from 'react';
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
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [tabGroups, setTabGroups] = useState<ITabGroup[]>([]);
  const [searchMode, setSearchMode] = useState<SearchMode>("normal");
  const [showFavicon, setShowFavicon] = useState(true);
  const [availableModes, setAvailableModes] = useState(modes);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const updateTabs = useCallback(async (query: string = "") => {
    try {
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
        items = allTabs.filter((tab) => tab.id !== currentTab.id);

        // Apply mode-specific filters
        switch (searchMode) {
          case "normal":
            items = items.filter(tab => !tab.incognito && !tab.pinned);
            break;
          case "pinned":
            items = items.filter(tab => tab.pinned);
            break;
          case "audible":
            items = items.filter(tab => tab.audible);
            break;
        }
      }

      const groups = groupTabs(items, query);
      const newFlattenedTabs = groups.flatMap(group => group.tabs);

      console.log('Updating tabs:', {
        items: items.length,
        groups: groups.length,
        tabs: newFlattenedTabs.length,
        query,
        mode: searchMode
      });

      // Always reset selection when tab list changes
      setSelectedIndex(0);
      setTabGroups(groups);

      console.log('Reset selection:', {
        newTabCount: newFlattenedTabs.length,
        selectedIndex: 0,
        firstTab: newFlattenedTabs[0]?.title
      });
    } catch (error) {
      console.error('Error updating tabs:', error);
    }
  }, [searchMode]);

  const matchesSearch = useCallback((item: TabInfo, query: string): boolean => {
    const searchStr = query.toLowerCase();
    return (
      !!item.title?.toLowerCase().includes(searchStr) ||
      !!item.url?.toLowerCase().includes(searchStr)
    );
  }, []);

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
  }, [searchMode, matchesSearch]);

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

  const isBrowserTab = (tab: TabInfo): tab is browser.tabs.Tab & { id: number; windowId: number } => {
    return typeof tab.id === 'number' && typeof tab.windowId === 'number';
  };

  const toggleSearchMode = useCallback(() => {
    if (isTransitioning) return;

    const currentIndex = availableModes.findIndex(({ id }) => id === searchMode);
    const nextIndex = (currentIndex + 1) % availableModes.length;
    const nextMode = availableModes[nextIndex].id;
    console.log(`Mode switching: ${searchMode} -> ${nextMode}`);

    setIsTransitioning(true);
    setTabGroups([]); // Clear current tabs for smooth transition

    // Small delay to allow for fade out
    setTimeout(() => {
      setSearchMode(nextMode);
      setIsTransitioning(false);
      // Restore focus to search input after mode switch
      searchInputRef.current?.focus();
    }, 150);
  }, [availableModes, searchMode, isTransitioning, searchInputRef]);

  // Get flattened list of all tabs for keyboard navigation
  const flattenedTabs = useMemo(() => {
    return tabGroups.flatMap(group => group.tabs);
  }, [tabGroups]);

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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Capture and handle arrow keys regardless of focus
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();

      const len = flattenedTabs.length;
      if (len === 0) return;

      const currentIndex = selectedIndex;
      let nextIndex = currentIndex;

      if (e.key === 'ArrowDown') {
        nextIndex = Math.min(currentIndex + 1, len - 1);
      } else {
        nextIndex = Math.max(currentIndex - 1, 0);
      }

      // Verify the next index is valid
      if (nextIndex < 0 || nextIndex >= len) {
        console.warn('Invalid index:', { nextIndex, len });
        return;
      }

      const nextTab = flattenedTabs[nextIndex];
      console.log('Selection change:', {
        direction: e.key,
        from: currentIndex,
        to: nextIndex,
        currentTab: flattenedTabs[currentIndex]?.title,
        nextTab: nextTab?.title,
        totalTabs: len,
        flattenedTabs: flattenedTabs.map(t => t.title)
      });

      setSelectedIndex(nextIndex);
      return;
    }

    // Handle other keys based on focus state
    if (e.key === "Escape") {
      window.close();
      return;
    }

    if (e.key === "Tab" && availableModes.length > 0) {
      e.preventDefault();
      toggleSearchMode();
      return;
    }

      if (e.key === 'Enter') {
        e.preventDefault();
        const len = flattenedTabs.length;
        if (len === 0) return;

        // Always use selectedIndex, even when search is focused
        const index = Math.min(selectedIndex, len - 1);
        const tab = flattenedTabs[index];

        console.log('Activating tab:', {
          selectedIndex,
          actualIndex: index,
          tabTitle: tab?.title,
          searchFocused: document.activeElement === searchInputRef.current,
          flattenedTabs: flattenedTabs.map(t => t.title)
        });

        if (tab) {
          handleSelectTab(tab);
        }
      }
  }, [flattenedTabs, selectedIndex, availableModes, toggleSearchMode, handleSelectTab, isBrowserTab]);


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

  useEffect(() => {
    const init = async () => {
      const settings = await loadSettings();
      setShowFavicon(settings.showFavicon);
      const newAvailableModes = settings.enableHistorySearch ? modes : modes.filter(m => m.id !== "history");
      setAvailableModes(newAvailableModes);
    };

    init();

    const handleVisibilityChange = () => {
      if (document.hidden) window.close();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]); // Only depends on handleKeyDown since it's used in the event listener

  useEffect(() => {
    if (!isTransitioning) {
      updateTabs(searchQuery);
    }
  }, [searchQuery, searchMode, isTransitioning, updateTabs]);

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
              selectedIndex={selectedIndex}
              flattenedIndex={(index) => flattenedTabs.indexOf(group.tabs[index])}
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
