async function findDuplicateTabs(tabUrl: string): Promise<browser.tabs.Tab[]> {
  const tabs = await browser.tabs.query({ url: tabUrl });
  return tabs;
}

async function handleDuplicateTabs(tab: browser.tabs.Tab) {
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

// Handle keyboard shortcut
browser.commands.onCommand.addListener((command) => {
  if (command === "open-zentab") {
    openZenTab();
  }
});

// Handle toolbar button click
browser.browserAction.onClicked.addListener(() => {
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
