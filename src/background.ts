import browser from "webextension-polyfill";
import { getDuplicateTabIds } from "./duplicateTabs";
import { createTabGroupPlans } from "./tabGroups";

type TabsWithUngroup = typeof browser.tabs & {
  ungroup?: (tabIds: number[]) => Promise<void>;
};

let duplicateCleanup = Promise.resolve();

function withDuplicateCleanupLock<T>(cleanup: () => Promise<T>): Promise<T> {
  const result = duplicateCleanup.then(cleanup, cleanup);
  duplicateCleanup = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function closeDuplicateTabs(
  tabs: browser.Tabs.Tab[]
): Promise<Set<number>> {
  const duplicateIds = getDuplicateTabIds(tabs);
  if (duplicateIds.length > 0) {
    await browser.tabs.remove(duplicateIds);
  }
  return new Set(duplicateIds);
}

async function handleDuplicateTabs(tab: browser.Tabs.Tab) {
  if (!tab.url) return;

  try {
    await withDuplicateCleanupLock(async () => {
      const duplicates = await browser.tabs.query({ url: tab.url });
      await closeDuplicateTabs(duplicates);
    });
  } catch (error) {
    console.error("Failed to close duplicate tabs", error);
  }
}

async function openZenTab() {
  const url = browser.runtime.getURL("index.html");
  await browser.tabs.create({ url });
}

async function groupTabs() {
  const createGroup = browser.tabs.group?.bind(browser.tabs);
  if (!createGroup) {
    console.warn("Tab groups are not supported by this browser");
    return;
  }

  try {
    const tabs = await withDuplicateCleanupLock(async () => {
      const candidates = (
        await browser.tabs.query({ currentWindow: true })
      ).filter((tab) => !tab.pinned);
      const duplicateIds = await closeDuplicateTabs(candidates);
      return candidates.filter(
        (tab) => tab.id === undefined || !duplicateIds.has(tab.id)
      );
    });

    const tabIds = tabs.flatMap((tab) =>
      tab.id === undefined ? [] : tab.id
    );
    if (tabIds.length === 0) return;

    const ungroupTabs = (browser.tabs as TabsWithUngroup).ungroup?.bind(
      browser.tabs
    );
    if (ungroupTabs) {
      await ungroupTabs(tabIds);
    }

    for (const plan of createTabGroupPlans(tabs)) {
      const groupId = await createGroup({
        tabIds: plan.tabIds,
      });
      console.log(`Created group ${plan.title} with ID ${groupId}`);
      await browser.tabGroups?.update(groupId, {
        title: plan.title,
      });
    }
  } catch (error) {
    console.error("Failed to group tabs", error);
  }
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
