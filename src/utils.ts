import { ZenTabSettings, defaultSettings } from "./types";

export async function loadSettings(): Promise<ZenTabSettings> {
  const [syncResult, localResult] = await Promise.all([
    browser.storage.sync.get({
      accentColor: defaultSettings.accentColor,
      showFavicon: defaultSettings.showFavicon,
      themeMode: defaultSettings.themeMode,
      enableHistorySearch: defaultSettings.enableHistorySearch,
    }),
    browser.storage.local.get({
      backgroundImage: defaultSettings.backgroundImage,
    }),
  ]);
  return {
    ...syncResult,
    backgroundImage: localResult.backgroundImage,
  } as ZenTabSettings;
}
