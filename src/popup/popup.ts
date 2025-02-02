import { TabGroup, TabGrouping } from "../types";

class TabManager {
  private searchInput: HTMLInputElement;
  private tabGroupsContainer: HTMLElement;

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
  }

  private async updateTabs(searchQuery: string = "") {
    const tabs = await browser.tabs.query({});
    const groups = this.groupTabs(tabs, searchQuery);
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

    groups.forEach((group) => {
      const groupElement = document.createElement("div");
      groupElement.className = "tab-group";

      const titleElement = document.createElement("div");
      titleElement.className = "group-title";
      titleElement.textContent = group.title;
      groupElement.appendChild(titleElement);

      group.tabs.forEach((tab) => {
        const tabElement = document.createElement("div");
        tabElement.className = "tab-item";

        const titleSpan = document.createElement("span");
        titleSpan.className = "tab-title";
        titleSpan.textContent = tab.title || "";
        titleSpan.addEventListener("click", () => this.switchToTab(tab));

        const closeButton = document.createElement("span");
        closeButton.className = "tab-close";
        closeButton.textContent = "×";
        closeButton.addEventListener("click", (e) => {
          e.stopPropagation();
          this.closeTab(tab);
        });

        tabElement.appendChild(titleSpan);
        tabElement.appendChild(closeButton);
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
    }
  }

  private async closeTab(tab: browser.tabs.Tab) {
    if (tab.id) {
      await browser.tabs.remove(tab.id);
      await this.updateTabs(this.searchInput.value);
    }
  }
}

// Initialize the tab manager when the popup loads
document.addEventListener("DOMContentLoaded", () => {
  new TabManager();
});
