import { ZenTabSettings, defaultSettings } from "../types";

export async function loadSettings(): Promise<ZenTabSettings> {
  const [syncResult, localResult] = await Promise.all([
    browser.storage.sync.get({
      selectedColor: defaultSettings.selectedColor,
      pinnedColor: defaultSettings.pinnedColor,
      hoverColor: defaultSettings.hoverColor,
      showFavicon: defaultSettings.showFavicon,
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

export const baseStyles = `
  body {
    max-width: 800px;
    margin: 0 auto;
    padding: 0;
    font-family: -apple-system, system-ui, BlinkMacSystemFont, sans-serif;
  }
  .search-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 16px 0;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  .search-inner {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 16px;
  }
  #search {
    width: 100%;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
  }
  #tab-groups {
    margin-top: 120px;
    padding: 0 16px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
  }
  .tab-group {
    margin-bottom: 24px;
  }
  .group-title {
    font-weight: bold;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #333;
    font-size: 14px;
    color: #333;
  }
  .tab-item {
    display: flex;
    align-items: center;
    padding: 8px;
    cursor: pointer;
    border-radius: 4px;
  }
  .tab-item:hover {
    background-color: #f0f0f0;
  }
  .tab-favicon {
    margin-right: 8px;
    flex-shrink: 0;
  }
  .tab-title {
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
  }
  .tab-close {
    padding: 4px 8px;
    margin-left: 8px;
    cursor: pointer;
    opacity: 0.6;
    font-size: 16px;
  }
  .tab-close:hover {
    opacity: 1;
  }
  .selected {
    background-color: #f0f0f0;
    outline: 2px solid #0060df;
  }
`;

export function applyStyles(settings: ZenTabSettings) {
  const styleId = "custom-styles";
  let style = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }

  // Apply base styles
  const baseStyleId = "base-styles";
  let baseStyle = document.getElementById(
    baseStyleId
  ) as HTMLStyleElement | null;
  if (!baseStyle) {
    baseStyle = document.createElement("style");
    baseStyle.id = baseStyleId;
    document.head.appendChild(baseStyle);
  }
  baseStyle.textContent = baseStyles;

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
