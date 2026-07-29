import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import type { Assessment, Checklist } from "../src/types.js";
import { evaluate } from "../src/validation.js";

async function fixture<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8")) as T;
}

test("a complete production assessment passes", async () => {
  const checklist = await fixture<Checklist>("../../checklist/checklist.json");
  const assessment = await fixture<Assessment>("../../examples/assessment.production.json");

  const outcome = evaluate(checklist, assessment);

  assert.equal(outcome.ready, true);
  assert.equal(outcome.summary.applicable, checklist.controls.length);
  assert.equal(outcome.summary.passed, checklist.controls.length);
  assert.deepEqual(outcome.errors, []);
});

test("missing and partial required controls fail with actionable errors", async () => {
  const checklist = await fixture<Checklist>("../../checklist/checklist.json");
  const assessment = await fixture<Assessment>("../../examples/assessment.incomplete.json");

  const outcome = evaluate(checklist, assessment);

  assert.equal(outcome.ready, false);
  assert.ok(outcome.summary.missing > 0);
  assert.match(outcome.errors.join("\n"), /is partial/);
  assert.match(outcome.errors.join("\n"), /is missing/);
});

test("duplicate and unknown result IDs are rejected", async () => {
  const checklist = await fixture<Checklist>("../../checklist/checklist.json");
  const assessment = await fixture<Assessment>("../../examples/assessment.production.json");
  const duplicate = assessment.controls[0];
  assert.ok(duplicate);
  assessment.controls.push(duplicate, {
    ...duplicate,
    id: "unknown-control",
  });

  const outcome = evaluate(checklist, assessment);

  assert.equal(outcome.ready, false);
  assert.match(outcome.errors.join("\n"), /duplicate control result/);
  assert.match(outcome.errors.join("\n"), /unknown control ID/);
});

test("controls above the selected maturity do not block a prototype", async () => {
  const checklist = await fixture<Checklist>("../../checklist/checklist.json");
  const assessment = await fixture<Assessment>("../../examples/assessment.production.json");
  assessment.feature.maturity = "prototype";
  assessment.controls = assessment.controls.filter((result) => {
    const control = checklist.controls.find((candidate) => candidate.id === result.id);
    return control?.level === "prototype";
  });

  const outcome = evaluate(checklist, assessment);

  assert.equal(outcome.ready, true);
  assert.equal(outcome.summary.applicable, 3);
});
