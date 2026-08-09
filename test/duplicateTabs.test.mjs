import assert from "node:assert/strict";
import test from "node:test";

import { getDuplicateTabIds } from "../src/duplicateTabs.ts";

test("closes older tabs with the same URL", () => {
  const tabs = [
    { id: 1, url: "https://example.com", lastAccessed: 10 },
    { id: 2, url: "https://example.com", lastAccessed: 20 },
    { id: 3, url: "https://example.org", lastAccessed: 5 },
  ];

  assert.deepEqual(getDuplicateTabIds(tabs), [1]);
});

test("uses the higher tab ID when access times are equal", () => {
  const tabs = [
    { id: 1, url: "https://example.com", lastAccessed: 10 },
    { id: 2, url: "https://example.com", lastAccessed: 10 },
  ];

  assert.deepEqual(getDuplicateTabIds(tabs), [1]);
});

test("ignores tabs that cannot be closed", () => {
  const tabs = [
    { url: "https://example.com", lastAccessed: 20 },
    { id: 1, url: "https://example.com", lastAccessed: 10 },
    { id: 2, lastAccessed: 5 },
  ];

  assert.deepEqual(getDuplicateTabIds(tabs), []);
});
