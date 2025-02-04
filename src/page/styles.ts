import { ZenTabSettings, defaultSettings } from "../types";

export async function loadSettings(): Promise<ZenTabSettings> {
  const [syncResult, localResult] = await Promise.all([
    browser.storage.sync.get({
      selectedColor: defaultSettings.selectedColor,
      pinnedColor: defaultSettings.pinnedColor,
      hoverColor: defaultSettings.hoverColor,
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

export function applyStyles(settings: ZenTabSettings) {
  const styleId = "custom-styles";
  let style = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }

  // Apply background image if available
  if (settings.backgroundImage) {
    document.body.style.backgroundImage = `url(${settings.backgroundImage})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
  } else {
    document.body.style.backgroundImage = "none";
  }
  style.textContent = `
    .tab-item:hover {
      background-color: ${settings.hoverColor} !important;
    }
    .selected {
      background-color: ${settings.selectedColor} !important;
      outline: 2px solid ${settings.pinnedColor} !important;
    }
    #mode-indicator {
      margin-bottom: 10px;
    }
    #mode-indicator span {
      margin-right: 5px;
    }
    #mode-indicator span.current-mode {
      font-weight: bold;
      color: inherit;
    }
  `;
}
