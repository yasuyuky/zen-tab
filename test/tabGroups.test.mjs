import assert from "node:assert/strict";
import test from "node:test";

import { createTabGroupPlans } from "../src/tabGroups.ts";

test("groups repeated hosts and collects single tabs", () => {
  const tabs = [
    { id: 2, url: "https://example.com/b", title: "B" },
    { id: 1, url: "https://example.com/a", title: "A" },
    { id: 3, url: "https://example.org", title: "C" },
  ];

  assert.deepEqual(createTabGroupPlans(tabs), [
    { title: "example.com", tabIds: [1, 2] },
    { title: "others", tabIds: [3] },
  ]);
});

test("does not create an empty others group", () => {
  const tabs = [
    { id: 1, url: "https://example.com/a" },
    { id: 2, url: "https://example.com/b" },
  ];

  assert.deepEqual(createTabGroupPlans(tabs), [
    { title: "example.com", tabIds: [1, 2] },
  ]);
});

test("skips invalid IDs and handles URLs without a hostname", () => {
  const tabs = [
    { url: "https://example.com" },
    { id: 1, url: "about:blank", title: "Blank" },
    { id: 2, url: "invalid URL", title: "Invalid" },
  ];

  assert.deepEqual(createTabGroupPlans(tabs), [
    { title: "others", tabIds: [1, 2] },
  ]);
});
