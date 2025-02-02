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
