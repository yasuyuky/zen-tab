import { ZenTabSettings, defaultSettings, ThemeMode } from "../types";

export async function loadSettings(): Promise<ZenTabSettings> {
  const [syncResult, localResult] = await Promise.all([
    browser.storage.sync.get({
      accentColor: defaultSettings.accentColor,
      showFavicon: defaultSettings.showFavicon,
      themeMode: defaultSettings.themeMode,
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
  :root {
    --bg-color: #ffffff;
    --text-color: #333333;
    --border-color: #cccccc;
    --container-bg: rgba(255, 255, 255, 0.1);
    --search-bg: rgba(255, 255, 255, 0.2);
    --hover-bg: #f0f0f0;
    --selected-bg: #f0f0f0;
    --accent-color: #0060df;
  }

  [data-theme="dark"] {
    --bg-color: #1a1a1a;
    --text-color: #ffffff;
    --border-color: #404040;
    --container-bg: rgba(0, 0, 0, 0.2);
    --search-bg: rgba(0, 0, 0, 0.3);
    --hover-bg: #2b2b2b;
    --selected-bg: #2b2b2b;
  }

  body {
    max-width: 800px;
    margin: 0 auto;
    padding: 0;
    font-family: -apple-system, system-ui, BlinkMacSystemFont, sans-serif;
    background-color: var(--bg-color);
    color: var(--text-color);
  }
  .search-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: var(--search-bg);
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
    border: 1px solid var(--border-color);
    background-color: var(--bg-color);
    color: var(--text-color);
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
  }
  #tab-groups {
    margin-top: 120px;
    padding: 0 16px;
    background: var(--container-bg);
    backdrop-filter: blur(4px);
  }
  .tab-group {
    margin-bottom: 24px;
  }
  .group-title {
    font-weight: bold;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--border-color);
    font-size: 14px;
    color: var(--text-color);
  }
  .tab-item {
    display: flex;
    align-items: center;
    padding: 8px;
    cursor: pointer;
    border-radius: 4px;
  }
  .tab-item:hover {
    background-color: var(--hover-bg);
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
    background-color: var(--selected-bg);
    outline: 2px solid var(--border-color);
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

  // Apply base styles and theme
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

  // Set up theme
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark =
    settings.themeMode === "dark" ||
    (settings.themeMode === "system" && prefersDark);
  document.body.setAttribute("data-theme", isDark ? "dark" : "light");

  // Add system theme listener if needed
  if (settings.themeMode === "system") {
    const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const themeHandler = (e: MediaQueryListEvent) => {
      document.body.setAttribute("data-theme", e.matches ? "dark" : "light");
    };
    themeQuery.addEventListener("change", themeHandler);
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

  // Set accent color CSS variable
  document.documentElement.style.setProperty(
    "--accent-color",
    settings.accentColor
  );

  style.textContent = `
    .selected {
      outline-color: var(--accent-color) !important;
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
