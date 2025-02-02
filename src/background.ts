// Listen for tab events to keep the popup up to date
browser.tabs.onCreated.addListener(() => {
  console.log("New tab created");
});

browser.tabs.onRemoved.addListener(() => {
  console.log("Tab removed");
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    console.log("Tab updated:", tab.url);
  }
});

// Keep the extension alive
browser.runtime.onInstalled.addListener(() => {
  console.log("Zen Tab extension installed");
});
