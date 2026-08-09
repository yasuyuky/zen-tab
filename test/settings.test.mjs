import assert from "node:assert/strict";
import test from "node:test";

import { getPageAppearance } from "../src/page/appearance.ts";
import { defaultSettings } from "../src/settings.ts";

test("uses one default for history search", () => {
  assert.equal(defaultSettings.enableHistorySearch, false);
});

test("resolves the page appearance from settings", () => {
  const settings = {
    ...defaultSettings,
    accentColor: "#123456",
    backgroundImage: "data:image/png;base64,image",
    themeMode: "system",
  };

  assert.deepEqual(getPageAppearance(settings, true), {
    theme: "dark",
    accentColor: "#123456",
    backgroundImage: "data:image/png;base64,image",
  });
});

test("an explicit light theme overrides the system theme", () => {
  const settings = { ...defaultSettings, themeMode: "light" };

  assert.equal(getPageAppearance(settings, true).theme, "light");
});
