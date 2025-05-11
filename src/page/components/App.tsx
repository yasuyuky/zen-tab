import React, { useEffect, useRef, ChangeEvent, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { TabGroup } from "./TabGroup";
import { TabInfo, TabGroup as ITabGroup } from "../types";
import {
  GlobalStyle,
  SearchContainer,
  SearchInner,
  SearchInput,
  ScrollContainer,
  TabGroupsContainer,
  ModeIndicator,
} from "../styles";
import {
  setSearchQuery,
  setSelectedIndex,
  setSearchMode,
  setIsTransitioning,
  clearTabGroups,
  loadInitialSettings,
  updateTabs,
} from "../store/tabSlice";
import { RootState } from "../store";
import browser from "webextension-polyfill";


export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    searchQuery,
    selectedIndex,
    tabGroups,
    searchMode,
    showFavicon,
    availableModes,
    isTransitioning,
  } = useAppSelector((state: RootState) => state.tabs);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const flattenedTabs = useMemo(() => {
    return tabGroups.flatMap((group) => group.tabs);
  }, [tabGroups]);

  const isBrowserTab = (
    tab: TabInfo
  ): tab is browser.Tabs.Tab & { id: number; windowId: number } => {
    return typeof tab.id === "number" && typeof tab.windowId === "number";
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
    dispatch(updateTabs());
  };

  const handleCloseGroup = async (group: ITabGroup) => {
    const promises = group.tabs.map((tab) => {
      if (searchMode === "history" && tab.url) {
        return browser.history.deleteUrl({ url: tab.url });
      } else if (isBrowserTab(tab) && !tab.pinned) {
        return browser.tabs.remove(tab.id);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
    dispatch(updateTabs());
  };

  const toggleSearchMode = useCallback(() => {
    if (isTransitioning) return;

    const currentIndex = availableModes.findIndex(({ id }) => id === searchMode);
    const nextIndex = (currentIndex + 1) % availableModes.length;
    const nextMode = availableModes[nextIndex].id;
    console.log(`Mode switching: ${searchMode} -> ${nextMode}`);

    dispatch(setIsTransitioning(true));
    dispatch(clearTabGroups()); // Clear current tabs for smooth transition

    // Small delay to allow for fade out
    setTimeout(() => {
      dispatch(setSearchMode(nextMode));
      dispatch(setIsTransitioning(false));
      // Restore focus to search input after mode switch
      searchInputRef.current?.focus();
    }, 150);
  }, [availableModes, searchMode, isTransitioning, dispatch]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Capture and handle arrow keys regardless of focus
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();

        const len = flattenedTabs.length;
        if (len === 0) return;

        let nextIndex: number;
        if (selectedIndex === null) {
          // First arrow key press selects first or last item
          nextIndex = e.key === "ArrowDown" ? 0 : len - 1;
        } else {
          // Subsequent presses move selection up/down
          if (e.key === "ArrowDown") {
            nextIndex = Math.min(selectedIndex + 1, len - 1);
          } else {
            nextIndex = Math.max(selectedIndex - 1, 0);
          }
        }

        // Verify the next index is valid
        if (nextIndex < 0 || nextIndex >= len) {
          console.warn("Invalid index:", { nextIndex, len });
          return;
        }

        const nextTab = flattenedTabs[nextIndex];
        console.log("Selection change:", {
          direction: e.key,
          previousIndex: selectedIndex,
          nextIndex,
          previousTab: selectedIndex !== null ? flattenedTabs[selectedIndex]?.title : null,
          nextTab: nextTab?.title,
          totalTabs: len,
        });

        dispatch(setSelectedIndex(nextIndex));
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

      if (e.key === "Enter") {
        e.preventDefault();
        const len = flattenedTabs.length;

        if ((len === 0 || selectedIndex === null) && searchQuery) {
          // No matching tabs or no selection, perform web search using browser's default search engine
          browser.search.query({ text: searchQuery });
          window.close();
          return;
        }

        const tab = flattenedTabs[selectedIndex!];

        console.log("Activating tab:", {
          selectedIndex,
          tabTitle: tab?.title,
          searchFocused: document.activeElement === searchInputRef.current,
        });

        if (tab) {
          handleSelectTab(tab);
        }
      }
    },
    [flattenedTabs, selectedIndex, availableModes, toggleSearchMode]
  );

  useEffect(() => {
    const init = async () => {
      dispatch(loadInitialSettings());
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
  }, [handleKeyDown, dispatch]);

  useEffect(() => {
    if (!isTransitioning) {
      dispatch(updateTabs());
    }
  }, [searchQuery, searchMode, isTransitioning, dispatch]);

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
                onClick={() => dispatch(setSearchMode(id))}
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
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              dispatch(setSearchQuery(e.target.value))
            }
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
