import { TabGroup, TabGrouping } from "../types";

class TabManager {
  private searchInput: HTMLInputElement;
  private tabGroupsContainer: HTMLElement;
  private selectedTabElement: HTMLElement | null = null;
  private allTabElements: HTMLElement[] = [];
  private showFavicon: boolean = true;
  private readonly modes = [
    { id: "normal", label: "Tabs" },
    { id: "pinned", label: "Pinned" },
    { id: "audible", label: "Audible" },
    { id: "history", label: "History" },
  ] as const;

  private availableModes: (typeof this.modes)[number][] = [];
  private searchMode: (typeof this.modes)[number]["id"] = "normal";

  constructor() {
    this.searchInput = document.getElementById("search") as HTMLInputElement;
    this.tabGroupsContainer = document.getElementById(
      "tab-groups"
    ) as HTMLElement;
    this.init();
  }

  private async init() {
    // Load and apply custom styles
    const { applyStyles } = await import("./styles");
    const { loadSettings } = await import("../utils");
    const settings = await loadSettings();
    applyStyles(settings);
    this.showFavicon = settings.showFavicon;

    // Set available modes based on settings
    this.availableModes = settings.enableHistorySearch
      ? [...this.modes]
      : this.modes.filter((mode) => mode.id !== "history");

    // Listen for settings changes
    browser.storage.onChanged.addListener(async (changes, area) => {
      if (
        (area === "sync" &&
          (changes.selectedColor ||
            changes.pinnedColor ||
            changes.hoverColor ||
            changes.showFavicon ||
            changes.enableHistorySearch)) ||
        (area === "local" && changes.backgroundImage)
      ) {
        const newSettings = await loadSettings();
        applyStyles(newSettings);
        if (changes.showFavicon) {
          this.showFavicon = newSettings.showFavicon;
          this.updateTabs(this.searchInput.value);
        }
        if (changes.enableHistorySearch) {
          this.availableModes = newSettings.enableHistorySearch
            ? [...this.modes]
            : this.modes.filter((mode) => mode.id !== "history");
          if (
            !newSettings.enableHistorySearch &&
            this.searchMode === "history"
          ) {
            this.searchMode = "normal";
          }
          this.updateModeIndicator();
          this.updateTabs(this.searchInput.value);
        }
      }
    });

    this.searchInput.addEventListener("input", () => this.handleSearch());
    const modeIndicator = document.createElement("div");
    modeIndicator.id = "mode-indicator";
    this.searchInput.parentElement?.insertBefore(
      modeIndicator,
      this.searchInput
    );
    this.updateModeIndicator();
    await this.updateTabs();
    // Focus on search input when page loads
    this.searchInput.focus();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) window.close();
    });

    // Listen for keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        window.close();
      } else if (e.key === "Tab") {
        e.preventDefault();
        this.toggleSearchMode();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!this.selectedTabElement && this.allTabElements.length > 0) {
          this.selectTabAtIndex(0);
        } else {
          this.selectNextTab();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!this.selectedTabElement && this.allTabElements.length > 0) {
          this.selectTabAtIndex(this.allTabElements.length - 1);
        } else {
          this.selectPreviousTab();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (this.selectedTabElement) {
          const tabId = this.selectedTabElement.getAttribute("data-tab-id");
          const windowId =
            this.selectedTabElement.getAttribute("data-window-id");
          if (tabId && windowId) {
            this.switchToTab({
              id: parseInt(tabId),
              windowId: parseInt(windowId),
            } as browser.tabs.Tab);
          }
        } else {
          const searchText = this.searchInput.value;
          if (searchText.trim()) {
            browser.search.query({ text: searchText });
          }
        }
      } else if (
        (e.key === "Backspace" || e.key === "Delete") &&
        e.metaKey &&
        this.selectedTabElement
      ) {
        e.preventDefault();
        if (!this.selectedTabElement.classList.contains("pinned")) {
          const tabId = this.selectedTabElement.getAttribute("data-tab-id");
          if (tabId) {
            this.closeTab({ id: parseInt(tabId) } as browser.tabs.Tab);
          }
        }
      }
    });

    // Clear selection when search input changes
    this.searchInput.addEventListener("input", () => {
      if (this.selectedTabElement) {
        this.selectedTabElement.classList.remove("selected");
        this.selectedTabElement = null;
      }
    });
  }

  private selectNextTab() {
    const currentIndex = this.selectedTabElement
      ? this.allTabElements.indexOf(this.selectedTabElement)
      : -1;
    const nextIndex =
      currentIndex < this.allTabElements.length - 1 ? currentIndex + 1 : 0;
    this.selectTabAtIndex(nextIndex);
  }

  private selectPreviousTab() {
    const currentIndex = this.selectedTabElement
      ? this.allTabElements.indexOf(this.selectedTabElement)
      : 0;
    const prevIndex =
      currentIndex > 0 ? currentIndex - 1 : this.allTabElements.length - 1;
    this.selectTabAtIndex(prevIndex);
  }

  private selectTabAtIndex(index: number) {
    if (this.selectedTabElement) {
      this.selectedTabElement.classList.remove("selected");
    }
    this.selectedTabElement = this.allTabElements[index];
    if (this.selectedTabElement) {
      this.selectedTabElement.classList.add("selected");

      const scrollContainer = document.querySelector(".scroll-container");
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = this.selectedTabElement.getBoundingClientRect();

        if (elementRect.bottom > containerRect.bottom) {
          scrollContainer.scrollBy({
            top: elementRect.bottom - containerRect.bottom,
            behavior: "smooth",
          });
        } else if (elementRect.top < containerRect.top) {
          scrollContainer.scrollBy({
            top: elementRect.top - containerRect.top,
            behavior: "smooth",
          });
        }
      }
    }
  }

  private async updateTabs(searchQuery: string = "") {
    const [currentTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const allTabs = await browser.tabs.query({});

    // Filter out current tab and apply mode-specific filtering
    let items: browser.tabs.Tab[] | browser.history.HistoryItem[] = [];

    if (this.searchMode === "history") {
      // Search in browser history
      if (searchQuery) {
        const historyItems = await browser.history.search({
          text: searchQuery,
          startTime: 0,
          maxResults: 100,
        });
        items = historyItems;
      }
    } else {
      items = allTabs
        .filter((tab) => tab.id !== currentTab.id)
        .filter((tab) => {
          switch (this.searchMode) {
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

    const groups = this.groupTabs(items, searchQuery);
    this.renderGroups(groups);
  }

  private formatDate(date: Date): string {
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
  }

  private groupTabs(
    items: browser.tabs.Tab[] | browser.history.HistoryItem[],
    searchQuery: string
  ): TabGroup[] {
    const grouping: TabGrouping = {};

    // Filter and group items
    items.forEach((item) => {
      if (!item.url || !item.title) return;

      if (searchQuery && !this.matchesSearch(item, searchQuery)) return;

      let groupKey: string;
      if (this.searchMode === "history" && this.isHistoryItem(item)) {
        const visitDate = new Date(item.lastVisitTime || Date.now());
        groupKey = this.formatDate(visitDate);
      } else {
        const url = new URL(item.url);
        groupKey = url.hostname;
      }

      if (!grouping[groupKey]) {
        grouping[groupKey] = [];
      }
      grouping[groupKey].push(item as browser.tabs.Tab);
    });

    // Convert grouping to array of TabGroup
    const groups = Object.entries(grouping).map(([key, tabs]) => ({
      title: key,
      tabs: tabs,
    }));

    // Sort groups
    if (this.searchMode === "history") {
      // For history mode, sort by date (most recent first)
      const dateOrder = ["Today", "Yesterday"];
      return groups.sort((a, b) => {
        const aIndex = dateOrder.indexOf(a.title);
        const bIndex = dateOrder.indexOf(b.title);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return this.getVisitTime(b.tabs[0]) - this.getVisitTime(a.tabs[0]);
      });
    } else {
      // For other modes, sort by domain alphabetically
      return groups.sort((a, b) => a.title.localeCompare(b.title));
    }
  }

  private isHistoryItem(
    item: browser.tabs.Tab | browser.history.HistoryItem
  ): item is browser.history.HistoryItem {
    return "lastVisitTime" in item;
  }

  private getVisitTime(
    item: browser.tabs.Tab | browser.history.HistoryItem
  ): number {
    if (this.isHistoryItem(item)) {
      return item.lastVisitTime || Date.now();
    }
    return Date.now();
  }

  private matchesSearch(
    item: browser.tabs.Tab | browser.history.HistoryItem,
    query: string
  ): boolean {
    const searchStr = query.toLowerCase();
    return (
      !!item.title?.toLowerCase().includes(searchStr) ||
      !!item.url?.toLowerCase().includes(searchStr)
    );
  }

  private renderGroups(groups: TabGroup[]) {
    this.tabGroupsContainer.innerHTML = "";
    this.allTabElements = [];
    this.selectedTabElement = null;

    groups.forEach((group) => {
      const groupElement = document.createElement("div");
      groupElement.className = "tab-group";

      const titleElement = document.createElement("div");
      titleElement.className = "group-title";

      const titleTextElement = document.createElement("span");
      titleTextElement.textContent = group.title;
      titleElement.appendChild(titleTextElement);

      if (this.searchMode === "history") {
        // Add delete button for history group
        const closeGroupButton = document.createElement("span");
        closeGroupButton.className = "group-close";
        closeGroupButton.textContent = "×";
        closeGroupButton.addEventListener("click", async (e) => {
          e.stopPropagation();
          await this.deleteHistoryItems(group.tabs);
          this.updateTabs(this.searchInput.value);
        });
        titleElement.appendChild(closeGroupButton);
      } else {
        const nonPinnedTabs = group.tabs.filter((tab) => !tab.pinned);
        if (nonPinnedTabs.length > 0) {
          const closeGroupButton = document.createElement("span");
          closeGroupButton.className = "group-close";
          closeGroupButton.textContent = "×";
          closeGroupButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.closeTabs(nonPinnedTabs);
          });
          titleElement.appendChild(closeGroupButton);
        }
      }

      groupElement.appendChild(titleElement);

      group.tabs.forEach((tab) => {
        const tabElement = document.createElement("div");
        tabElement.className = "tab-item" + (tab.pinned ? " pinned" : "");

        if (this.showFavicon && tab.favIconUrl) {
          const favicon = document.createElement("img");
          favicon.className = "tab-favicon";
          favicon.src = tab.favIconUrl;
          favicon.width = 16;
          favicon.height = 16;
          tabElement.appendChild(favicon);
        }
        tabElement.setAttribute("data-tab-id", tab.id?.toString() || "");
        tabElement.setAttribute(
          "data-window-id",
          tab.windowId?.toString() || ""
        );

        const contentDiv = document.createElement("div");
        contentDiv.className = "tab-content";

        const titleSpan = document.createElement("span");
        titleSpan.className = "tab-title";
        titleSpan.textContent = tab.title || "";

        contentDiv.appendChild(titleSpan);

        if (this.searchMode === "history") {
          const urlSpan = document.createElement("div");
          urlSpan.className = "tab-url";
          urlSpan.textContent = tab.url || "";
          contentDiv.appendChild(urlSpan);
        }

        tabElement.appendChild(contentDiv);

        tabElement.addEventListener("click", () => {
          if (this.searchMode === "history") {
            browser.tabs.create({ url: tab.url });
            window.close();
          } else {
            this.switchToTab(tab);
          }
        });

        // Show close button for history items or non-pinned tabs
        if (this.searchMode === "history" || !tab.pinned) {
          const closeButton = document.createElement("span");
          closeButton.className = "tab-close";
          closeButton.textContent = "×";
          closeButton.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (this.searchMode === "history") {
              await this.deleteHistoryItems([tab]);
              this.updateTabs(this.searchInput.value);
            } else {
              this.closeTab(tab);
            }
          });
          tabElement.appendChild(closeButton);
        }

        this.allTabElements.push(tabElement);
        groupElement.appendChild(tabElement);
      });

      this.tabGroupsContainer.appendChild(groupElement);
    });
  }

  private async handleSearch() {
    const query = this.searchInput.value;
    await this.updateTabs(query);
  }

  private async switchToTab(tab: browser.tabs.Tab) {
    if (tab.id && tab.windowId) {
      await browser.tabs.update(tab.id, { active: true });
      await browser.windows.update(tab.windowId, { focused: true });
      window.close();
    }
  }

  private async deleteHistoryItems(
    items: (browser.tabs.Tab | browser.history.HistoryItem)[]
  ) {
    const historyItems = items.filter(this.isHistoryItem);
    const itemsWithUrl = historyItems.filter(
      (item): item is browser.history.HistoryItem & { url: string } =>
        typeof item.url === "string"
    );
    await Promise.all(
      itemsWithUrl.map((item) => browser.history.deleteUrl({ url: item.url }))
    );
  }

  private async closeTabs(tabs: browser.tabs.Tab[]) {
    const tabIds = tabs.map((tab) => tab.id).filter((id): id is number => !!id);
    await browser.tabs.remove(tabIds);
    await this.updateTabs(this.searchInput.value);
  }

  private async closeTab(tab: browser.tabs.Tab) {
    if (tab.id) {
      // Get the current index before removing the tab
      const currentIndex = this.allTabElements.indexOf(
        this.selectedTabElement!
      );
      await browser.tabs.remove(tab.id);
      await this.updateTabs(this.searchInput.value);

      // After updating tabs, select the next tab if available
      if (this.allTabElements.length > 0) {
        // If we're at the last tab, select the previous one
        const nextIndex =
          currentIndex >= this.allTabElements.length
            ? this.allTabElements.length - 1
            : currentIndex;
        this.selectTabAtIndex(nextIndex);
      }
    }
  }
  private toggleSearchMode() {
    const currentIndex = this.availableModes.findIndex(
      ({ id }) => id === this.searchMode
    );
    const nextIndex = (currentIndex + 1) % this.availableModes.length;
    this.searchMode = this.availableModes[nextIndex].id;

    console.log(`Switched to ${this.searchMode} mode`);
    this.updateTabs(this.searchInput.value);
    this.updateModeIndicator();
    this.searchInput.focus();
  }

  private updateModeIndicator() {
    const modeIndicator = document.getElementById("mode-indicator");
    if (!modeIndicator) return;

    // Generate indicators HTML
    modeIndicator.innerHTML = this.availableModes
      .map(
        ({ id, label }) => `
        <span id="indicator-${id}" class="${
          this.searchMode === id ? "current-mode" : ""
        }" style="cursor: pointer;">
          ${label}
        </span>
      `
      )
      .join("");

    // Add click handlers
    this.availableModes.forEach(({ id }) => {
      const indicator = document.getElementById(`indicator-${id}`);
      indicator?.addEventListener("click", () => {
        this.searchMode = id as typeof this.searchMode;
        this.updateTabs(this.searchInput.value);
        this.updateModeIndicator();
        this.searchInput.focus();
      });
    });
  }
}

// Initialize the tab manager when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new TabManager();
});
