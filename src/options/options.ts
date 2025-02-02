interface ZenTabSettings {
  selectedColor: string;
  pinnedColor: string;
  hoverColor: string;
}

const defaultSettings: ZenTabSettings = {
  selectedColor: "#f0f0f0",
  pinnedColor: "#0060df",
  hoverColor: "#f0f0f0",
};

class OptionsManager {
  private selectedColorInput: HTMLInputElement;
  private pinnedColorInput: HTMLInputElement;
  private hoverColorInput: HTMLInputElement;
  private saveButton: HTMLButtonElement;

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

    this.init();
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

    // Update previews initially
    this.updateAllPreviews();
  }

  private async loadSettings(): Promise<ZenTabSettings> {
    const result = await browser.storage.sync.get(defaultSettings);
    return result as ZenTabSettings;
  }

  private updateInputs(settings: ZenTabSettings) {
    this.selectedColorInput.value = settings.selectedColor;
    this.pinnedColorInput.value = settings.pinnedColor;
    this.hoverColorInput.value = settings.hoverColor;
  }

  private updatePreview(type: keyof ZenTabSettings) {
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
    const settings: ZenTabSettings = {
      selectedColor: this.selectedColorInput.value,
      pinnedColor: this.pinnedColorInput.value,
      hoverColor: this.hoverColorInput.value,
    };

    await browser.storage.sync.set(settings);
    this.showSaveConfirmation();
  }

  private showSaveConfirmation() {
    const originalText = this.saveButton.textContent;
    this.saveButton.textContent = "Saved!";
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
