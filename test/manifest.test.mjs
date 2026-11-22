import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const manifest = JSON.parse(
  await readFile(new URL("../manifest.json", import.meta.url), "utf8")
);

test("uses one cross-browser Manifest V3 configuration", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(
    manifest.background.service_worker,
    manifest.background.scripts[0]
  );
  assert.ok(manifest.action);
  assert.ok(manifest.permissions.includes("tabGroups"));
});
