#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { renderReport } from "./report.js";
import type { Assessment, Checklist, ValidationOutcome } from "./types.js";
import { evaluate, loadValidators, readJson, schemaErrors } from "./validation.js";

interface Arguments {
  command: "validate" | "report";
  assessmentPath: string;
  checklistPath: string;
  outputPath?: string;
}

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function main(argv: string[]): Promise<number> {
  let args: Arguments;
  try {
    args = parseArguments(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printUsage();
    return 2;
  }

  try {
    const [checklistValue, assessmentValue, validators] = await Promise.all([
      readJson(args.checklistPath),
      readJson(args.assessmentPath),
      loadValidators(
        path.join(packageRoot, "schemas/checklist.schema.json"),
        path.join(packageRoot, "schemas/assessment.schema.json"),
      ),
    ]);

    const structuralErrors: string[] = [];
    if (!validators.checklist(checklistValue)) {
      structuralErrors.push(...schemaErrors("Checklist", validators.checklist.errors));
    }
    if (!validators.assessment(assessmentValue)) {
      structuralErrors.push(...schemaErrors("Assessment", validators.assessment.errors));
    }

    if (structuralErrors.length > 0) {
      for (const error of structuralErrors) {
        console.error(`ERROR: ${error}`);
      }
      return 2;
    }

    const checklist = checklistValue as Checklist;
    const assessment = assessmentValue as Assessment;
    const outcome = evaluate(checklist, assessment);

    if (args.command === "report") {
      await outputReport(args, checklist, assessment, outcome);
    } else {
      printOutcome(assessment, outcome);
    }
    return outcome.ready ? 0 : 1;
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    return 2;
  }
}

function parseArguments(argv: string[]): Arguments {
  const [command, assessmentPath, ...rest] = argv;
  if (command !== "validate" && command !== "report") {
    throw new Error('First argument must be "validate" or "report".');
  }
  if (assessmentPath === undefined || assessmentPath.startsWith("-")) {
    throw new Error("An assessment JSON path is required.");
  }

  let checklistPath = path.join(packageRoot, "checklist/checklist.json");
  let outputPath: string | undefined;
  for (let index = 0; index < rest.length; index += 1) {
    const option = rest[index];
    const value = rest[index + 1];
    if (option === "--checklist" && value !== undefined) {
      checklistPath = path.resolve(value);
      index += 1;
    } else if (option === "--output" && value !== undefined && command === "report") {
      outputPath = path.resolve(value);
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete option: ${option ?? ""}`);
    }
  }

  const parsed: Arguments = {
    command,
    assessmentPath: path.resolve(assessmentPath),
    checklistPath,
  };
  if (outputPath !== undefined) {
    parsed.outputPath = outputPath;
  }
  return parsed;
}

async function outputReport(
  args: Arguments,
  checklist: Checklist,
  assessment: Assessment,
  outcome: ValidationOutcome,
): Promise<void> {
  const report = renderReport(checklist, assessment, outcome);
  if (args.outputPath === undefined) {
    process.stdout.write(report);
  } else {
    await writeFile(args.outputPath, report, "utf8");
    console.log(`Report written to ${args.outputPath}`);
  }
  if (!outcome.ready) {
    console.error(`${outcome.errors.length} release blocker(s) found.`);
  }
}

function printOutcome(assessment: Assessment, outcome: ValidationOutcome): void {
  console.log(
    `${assessment.feature.name}: ${outcome.ready ? "READY" : "NOT READY"} for ${assessment.feature.maturity}`,
  );
  console.log(
    `Applicable ${outcome.summary.applicable}: ${outcome.summary.passed} pass, ${outcome.summary.notApplicable} not applicable, ${outcome.summary.partial} partial, ${outcome.summary.failed} fail, ${outcome.summary.missing} missing.`,
  );
  for (const warning of outcome.warnings) {
    console.warn(`WARNING: ${warning}`);
  }
  for (const error of outcome.errors) {
    console.error(`ERROR: ${error}`);
  }
}

function printUsage(): void {
  console.error(
    "Usage:\n" +
      "  production-ai-checklist validate <assessment.json> [--checklist <file>]\n" +
      "  production-ai-checklist report <assessment.json> [--checklist <file>] [--output <file>]",
  );
}

process.exitCode = await main(process.argv.slice(2));

export { main };
