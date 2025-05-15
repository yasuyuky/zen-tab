import browser from "webextension-polyfill";

async function findDuplicateTabs(tabUrl: string): Promise<browser.Tabs.Tab[]> {
  const tabs = await browser.tabs.query({ url: tabUrl });
  return tabs;
}

async function handleDuplicateTabs(tab: browser.Tabs.Tab) {
  if (!tab.url) return;

  const duplicates = await findDuplicateTabs(tab.url);
  if (duplicates.length > 1) {
    // Keep the most recently activated tab and remove others
    const tabsToClose = duplicates
      .filter((t) => t.id !== tab.id)
      .map((t) => t.id)
      .filter((id): id is number => id !== undefined);

    await browser.tabs.remove(tabsToClose);
  }
}

async function openZenTab() {
  const url = browser.runtime.getURL("index.html");
  await browser.tabs.create({ url });
}

async function groupTabs() {
  const tabs = (await browser.tabs.query({})).flatMap((tab) =>
    tab.pinned ? [] : tab
  );

  (browser.tabs as any).ungroup(tabs.map((tab) => tab.id));
  const group0: { [key: string]: browser.Tabs.Tab[] } = {};

  for (const tab of tabs) {
    if (tab.url) {
      const groupKey = new URL(tab.url).hostname;
      if (!group0[groupKey]) {
        group0[groupKey] = [];
      }
      group0[groupKey].push(tab);
    }
  }

  const group1: { [key: string]: browser.Tabs.Tab[] } = { others: [] };
  for (const [key, value] of Object.entries(group0)) {
    if (value.length > 1) {
      group1[key] = value.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );
    } else {
      group1["others"].push(value[0]);
    }
  }
  for (const [key, value] of Object.entries(group1)) {
    if (browser.tabs.group) {
      const groupId = await browser.tabs.group({
        tabIds: value.map((tab) => tab.id || 0),
      });
      console.log(`Created group ${key} with ID ${groupId}`);
      await browser.tabGroups?.update(groupId, {
        title: key,
      });
    }
  }
  return;
}

// Handle keyboard shortcut
browser.commands.onCommand.addListener((command) => {
  if (command === "open-zentab") {
    openZenTab();
  } else if (command === "group-tabs") {
    groupTabs();
  }
});

// Handle toolbar button click
browser.browserAction.onClicked.addListener(() => {
  groupTabs();
  openZenTab();
});

// Keep the extension alive and initialize
browser.runtime.onInstalled.addListener(() => {
  console.log("Zen Tab extension installed");
});

// Monitor tab creation and updates
browser.tabs.onCreated.addListener(async (tab) => {
  if (tab.url) {
    await handleDuplicateTabs(tab);
  }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    await handleDuplicateTabs(tab);
  }
});

browser.runtime.onMessage.addListener(
  (message: any, _sender, _sendResponse) => {
    if (message.action === "openZenTab") {
      openZenTab();
    } else if (message.action === "groupTabs") {
      groupTabs();
    }
    return true;
  }
);
