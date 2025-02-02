import { ZenTabSettings, defaultSettings } from "../types";

export async function loadSettings(): Promise<ZenTabSettings> {
  const result = await browser.storage.sync.get(defaultSettings);
  return result as ZenTabSettings;
}

export function applyStyles(settings: ZenTabSettings) {
  const styleId = "custom-styles";
  let style = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }
  style.textContent = `
    .tab-item:hover {
      background-color: ${settings.hoverColor} !important;
    }
    .selected {
      background-color: ${settings.selectedColor} !important;
      outline: 2px solid ${settings.pinnedColor} !important;
    }
    .pinned {
      background-color: rgba(0, 0, 0, 0.03);
      border-left: 2px solid ${settings.pinnedColor} !important;
    }
  `;
}
