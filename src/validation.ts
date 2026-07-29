import { readFile } from "node:fs/promises";

import {
  Ajv2020,
  type AnySchema,
  type ErrorObject,
  type ValidateFunction,
} from "ajv/dist/2020.js";

import type {
  Assessment,
  Checklist,
  Maturity,
  ValidationOutcome,
  ValidationSummary,
} from "./types.js";

const maturityRank: Record<Maturity, number> = {
  prototype: 0,
  pilot: 1,
  production: 2,
};

export async function readJson(path: string): Promise<unknown> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    throw new Error(`Cannot read ${path}: ${messageFrom(error)}`);
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(`Invalid JSON in ${path}: ${messageFrom(error)}`);
  }
}

export async function loadValidators(
  checklistSchemaPath: string,
  assessmentSchemaPath: string,
): Promise<{
  checklist: ValidateFunction;
  assessment: ValidateFunction;
}> {
  const [checklistSchema, assessmentSchema] = await Promise.all([
    readJson(checklistSchemaPath),
    readJson(assessmentSchemaPath),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addFormat("date", {
    type: "string",
    validate: isIsoDate,
  });
  return {
    checklist: ajv.compile(checklistSchema as AnySchema),
    assessment: ajv.compile(assessmentSchema as AnySchema),
  };
}

export function schemaErrors(kind: string, errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map((error) => {
    const location = error.instancePath || "/";
    return `${kind} ${location}: ${error.message ?? "is invalid"}`;
  });
}

export function evaluate(checklist: Checklist, assessment: Assessment): ValidationOutcome {
  const errors: string[] = [];
  const warnings: string[] = [];
  const summary: ValidationSummary = {
    applicable: 0,
    passed: 0,
    notApplicable: 0,
    partial: 0,
    failed: 0,
    missing: 0,
  };

  if (assessment.checklistVersion !== checklist.version) {
    errors.push(
      `Assessment expects checklist ${assessment.checklistVersion}, but ${checklist.version} was provided.`,
    );
  }

  const definitionIds = new Set<string>();
  for (const control of checklist.controls) {
    if (definitionIds.has(control.id)) {
      errors.push(`Checklist contains duplicate control ID "${control.id}".`);
    }
    definitionIds.add(control.id);
  }

  const results = new Map<string, Assessment["controls"][number]>();
  for (const result of assessment.controls) {
    if (results.has(result.id)) {
      errors.push(`Assessment contains duplicate control result "${result.id}".`);
      continue;
    }
    results.set(result.id, result);
    if (!definitionIds.has(result.id)) {
      errors.push(`Assessment contains unknown control ID "${result.id}".`);
    }
  }

  const selectedRank = maturityRank[assessment.feature.maturity];
  for (const control of checklist.controls) {
    if (maturityRank[control.level] > selectedRank) {
      continue;
    }
    summary.applicable += 1;
    const result = results.get(control.id);
    if (result === undefined) {
      summary.missing += 1;
      if (control.required) {
        errors.push(
          `Required ${control.level} control "${control.id}" is missing. Add an owned result and evidence or an applicability rationale.`,
        );
      } else {
        warnings.push(`Optional control "${control.id}" has not been assessed.`);
      }
      continue;
    }

    if (result.status === "pass") {
      summary.passed += 1;
    } else if (result.status === "not_applicable") {
      summary.notApplicable += 1;
    } else if (result.status === "partial") {
      summary.partial += 1;
      if (control.required) {
        errors.push(
          `Required control "${control.id}" is partial. Complete the control and attach evidence before ${assessment.feature.maturity} release.`,
        );
      }
    } else {
      summary.failed += 1;
      if (control.required) {
        errors.push(
          `Required control "${control.id}" failed. Resolve it or document why it is not applicable.`,
        );
      }
    }
  }

  for (const [id] of results) {
    const control = checklist.controls.find((candidate) => candidate.id === id);
    if (control !== undefined && maturityRank[control.level] > selectedRank) {
      warnings.push(
        `Control "${id}" targets ${control.level}; it is recorded early and does not affect this ${assessment.feature.maturity} gate.`,
      );
    }
  }

  return {
    ready: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
