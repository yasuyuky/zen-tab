import {
  ZenTabSettings,
  defaultSettings,
  darkModeSettings,
  ThemeMode,
} from "../types";

class OptionsManager {
  private selectedColorInput: HTMLInputElement;
  private pinnedColorInput: HTMLInputElement;
  private hoverColorInput: HTMLInputElement;
  private saveButton: HTMLButtonElement;
  private backgroundUploader: HTMLInputElement;
  private clearBackgroundButton: HTMLButtonElement;
  private showFaviconInput: HTMLInputElement;
  private themeModeSelect: HTMLSelectElement;
  private backgroundImageData: string = "";

  constructor() {
    this.selectedColorInput = document.getElementById(
      "selectedColor"
    ) as HTMLInputElement;
    this.pinnedColorInput = document.getElementById(
      "pinnedColor"
    ) as HTMLInputElement;
    this.hoverColorInput = document.getElementById(
      "hoverColor"
    ) as HTMLInputElement;
    this.saveButton = document.getElementById("save") as HTMLButtonElement;
    this.backgroundUploader = document.getElementById(
      "backgroundUploader"
    ) as HTMLInputElement;
    this.clearBackgroundButton = document.getElementById(
      "clearBackground"
    ) as HTMLButtonElement;
    this.showFaviconInput = document.getElementById(
      "showFavicon"
    ) as HTMLInputElement;
    this.themeModeSelect = document.getElementById(
      "themeMode"
    ) as HTMLSelectElement;

    this.backgroundUploader.addEventListener("change", () =>
      this.handleBackgroundUpload()
    );
    this.clearBackgroundButton.addEventListener("click", () =>
      this.handleClearBackground()
    );
    this.themeModeSelect.addEventListener("change", () =>
      this.handleThemeChange()
    );

    this.init();
  }

  private async handleClearBackground() {
    this.backgroundImageData = "";
    this.backgroundUploader.value = "";
    await browser.storage.local.remove("backgroundImage");
    this.showSaveConfirmation("Background cleared!");
  }

  private handleBackgroundUpload() {
    const file = this.backgroundUploader.files
      ? this.backgroundUploader.files[0]
      : null;
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxSize) {
      alert("Image file is too large. Please choose an image under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result && result.startsWith("data:image/")) {
        this.backgroundImageData = result;
        console.log("Background image is loaded");
      } else {
        alert("Invalid image file. Please choose a valid image file.");
      }
    };
    reader.readAsDataURL(file);
  }

  private handleThemeChange() {
    const theme = this.themeModeSelect.value as ThemeMode;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);

    document.body.setAttribute("data-theme", isDark ? "dark" : "light");

    if (isDark) {
      this.selectedColorInput.value = darkModeSettings.selectedColor!;
      this.pinnedColorInput.value = darkModeSettings.pinnedColor!;
      this.hoverColorInput.value = darkModeSettings.hoverColor!;
    } else {
      this.selectedColorInput.value = defaultSettings.selectedColor;
      this.pinnedColorInput.value = defaultSettings.pinnedColor;
      this.hoverColorInput.value = defaultSettings.hoverColor;
    }

    this.updateAllPreviews();
  }

  private async init() {
    // Load current settings
    const settings = await this.loadSettings();
    this.updateInputs(settings);

    // Add event listeners
    this.selectedColorInput.addEventListener("input", () =>
      this.updatePreview("selectedColor")
    );
    this.pinnedColorInput.addEventListener("input", () =>
      this.updatePreview("pinnedColor")
    );
    this.hoverColorInput.addEventListener("input", () =>
      this.updatePreview("hoverColor")
    );
    this.saveButton.addEventListener("click", () => this.saveSettings());

    // Set initial theme
    this.themeModeSelect.value = settings.themeMode;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark =
      settings.themeMode === "dark" ||
      (settings.themeMode === "system" && prefersDark);
    document.body.setAttribute("data-theme", isDark ? "dark" : "light");

    // Update previews initially
    this.updateAllPreviews();
  }

  private async loadSettings(): Promise<ZenTabSettings> {
    const [syncResult, localResult] = await Promise.all([
      browser.storage.sync.get({
        selectedColor: defaultSettings.selectedColor,
        pinnedColor: defaultSettings.pinnedColor,
        hoverColor: defaultSettings.hoverColor,
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

  private updateInputs(settings: ZenTabSettings) {
    this.selectedColorInput.value = settings.selectedColor;
    this.pinnedColorInput.value = settings.pinnedColor;
    this.hoverColorInput.value = settings.hoverColor;
    this.backgroundImageData = settings.backgroundImage;
    this.showFaviconInput.checked = settings.showFavicon;
    this.themeModeSelect.value = settings.themeMode;
  }

  private updatePreview(type: "selectedColor" | "pinnedColor" | "hoverColor") {
    const preview = document.getElementById(`${type}Preview`);
    if (preview) {
      const input = this[`${type}Input`] as HTMLInputElement;
      preview.style.backgroundColor = input.value;
    }
  }

  private updateAllPreviews() {
    this.updatePreview("selectedColor");
    this.updatePreview("pinnedColor");
    this.updatePreview("hoverColor");
  }

  private async saveSettings() {
    const syncSettings = {
      selectedColor: this.selectedColorInput.value,
      pinnedColor: this.pinnedColorInput.value,
      hoverColor: this.hoverColorInput.value,
      showFavicon: this.showFaviconInput.checked,
      themeMode: this.themeModeSelect.value as ThemeMode,
    };

    const localSettings = {
      backgroundImage: this.backgroundImageData || "",
    };

    await Promise.all([
      browser.storage.sync.set(syncSettings),
      browser.storage.local.set(localSettings),
    ]);
    this.showSaveConfirmation();
  }

  private showSaveConfirmation(message: string = "Saved!") {
    const originalText = this.saveButton.textContent;
    this.saveButton.textContent = message;
    this.saveButton.disabled = true;
    setTimeout(() => {
      this.saveButton.textContent = originalText;
      this.saveButton.disabled = false;
    }, 2000);
  }
}

// Initialize options page
document.addEventListener("DOMContentLoaded", () => {
  new OptionsManager();
});
