import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const cli = new URL("../src/cli.js", import.meta.url);

test("CLI exits zero for a ready assessment", () => {
  const result = spawnSync(process.execPath, [cli.pathname, "validate", "examples/assessment.production.json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /READY for production/);
});

test("CLI exits one and explains incomplete controls", () => {
  const result = spawnSync(process.execPath, [cli.pathname, "validate", "examples/assessment.incomplete.json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Required control/);
});

test("CLI exits two for malformed JSON", () => {
  const result = spawnSync(process.execPath, [cli.pathname, "validate", "test/fixtures-does-not-exist.json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Cannot read/);
});
