import { TabGroup, TabGrouping } from "../types";

class TabManager {
  private searchInput: HTMLInputElement;
  private tabGroupsContainer: HTMLElement;
  private selectedTabElement: HTMLElement | null = null;
  private allTabElements: HTMLElement[] = [];

  constructor() {
    this.searchInput = document.getElementById("search") as HTMLInputElement;
    this.tabGroupsContainer = document.getElementById(
      "tab-groups"
    ) as HTMLElement;
    this.init();
  }

  private async init() {
    this.searchInput.addEventListener("input", () => this.handleSearch());
    await this.updateTabs();
    // Focus on search input when page loads
    this.searchInput.focus();

    // Listen for keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        window.close();
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
      } else if (e.key === "Enter" && this.selectedTabElement) {
        e.preventDefault();
        const tabId = this.selectedTabElement.getAttribute("data-tab-id");
        const windowId = this.selectedTabElement.getAttribute("data-window-id");
        if (tabId && windowId) {
          this.switchToTab({
            id: parseInt(tabId),
            windowId: parseInt(windowId),
          } as browser.tabs.Tab);
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
      this.selectedTabElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }

  private async updateTabs(searchQuery: string = "") {
    const [currentTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const allTabs = await browser.tabs.query({});

    // Filter out the current tab (Zen Tab interface)
    const filteredTabs = allTabs.filter((tab) => tab.id !== currentTab.id);

    const groups = this.groupTabs(filteredTabs, searchQuery);
    this.renderGroups(groups);
  }

  private groupTabs(tabs: browser.tabs.Tab[], searchQuery: string): TabGroup[] {
    const grouping: TabGrouping = {};

    // Filter and group tabs
    tabs.forEach((tab) => {
      if (!tab.url || !tab.title) return;

      if (searchQuery && !this.matchesSearch(tab, searchQuery)) return;

      const url = new URL(tab.url);
      const domain = url.hostname;

      if (!grouping[domain]) {
        grouping[domain] = [];
      }
      grouping[domain].push(tab);
    });

    // Convert grouping to array of TabGroup
    return Object.entries(grouping)
      .map(([domain, tabs]) => ({
        title: domain,
        tabs: tabs,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  private matchesSearch(tab: browser.tabs.Tab, query: string): boolean {
    const searchStr = query.toLowerCase();
    return (
      tab.title?.toLowerCase().includes(searchStr) ||
      false ||
      tab.url?.toLowerCase().includes(searchStr) ||
      false
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
      titleElement.textContent = group.title;
      groupElement.appendChild(titleElement);

      group.tabs.forEach((tab) => {
        const tabElement = document.createElement("div");
        tabElement.className = "tab-item" + (tab.pinned ? " pinned" : "");
        tabElement.setAttribute("data-tab-id", tab.id?.toString() || "");
        tabElement.setAttribute(
          "data-window-id",
          tab.windowId?.toString() || ""
        );

        const titleSpan = document.createElement("span");
        titleSpan.className = "tab-title";
        titleSpan.textContent = tab.title || "";
        tabElement.addEventListener("click", () => this.switchToTab(tab));

        tabElement.appendChild(titleSpan);

        if (!tab.pinned) {
          const closeButton = document.createElement("span");
          closeButton.className = "tab-close";
          closeButton.textContent = "×";
          closeButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.closeTab(tab);
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

  private async closeTab(tab: browser.tabs.Tab) {
    if (tab.id) {
      await browser.tabs.remove(tab.id);
      await this.updateTabs(this.searchInput.value);
    }
  }
}

// Initialize the tab manager when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new TabManager();
});
