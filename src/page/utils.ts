import browser from "webextension-polyfill";

import { ZenTabSettings } from "./types";

export const loadSettings = async (): Promise<ZenTabSettings> => {
  const result = await browser.storage.sync.get({
    themeMode: "system",
    showFavicon: true,
    enableHistorySearch: true,
    accentColor: "#0060df",
  });

  const localResult = await browser.storage.local.get({
    backgroundImage: "",
  });

  return {
    ...result,
    backgroundImage: localResult.backgroundImage,
  } as ZenTabSettings;
};
