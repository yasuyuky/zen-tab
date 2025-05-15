import browser from "webextension-polyfill";

document.getElementById("open-zen-tab")?.addEventListener("click", () => {
  browser.runtime.sendMessage({ action: "openZenTab" });
});
document.getElementById("group-tabs")?.addEventListener("click", () => {
  browser.runtime.sendMessage({ action: "groupTabs" });
});
