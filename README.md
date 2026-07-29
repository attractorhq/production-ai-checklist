# Production AI Checklist

An evidence-based checklist and practical toolkit for shipping reliable AI
features.

AI prototypes become production risks when critical decisions live in chat,
review relies on confidence instead of evidence, or operational ownership is
unclear. This repository provides:

- a staged checklist for **prototype**, **pilot**, and **production**;
- stable JSON Schemas for checklist definitions and assessments;
- practical briefs, evaluation plans, system cards, launch reviews, and
  incident runbooks;
- a provider-neutral TypeScript CLI that produces a Markdown report and fails
  CI when required controls are missing.

No model API, API key, paid service, or network connection is used at runtime.

## Quick start

Requirements: Node.js 20 or newer.

```bash
npm ci
npm run build
node dist/src/cli.js validate examples/assessment.production.json
node dist/src/cli.js report examples/assessment.production.json \
  --output assessment-report.md
```

The example passes and the report explains every control. To see actionable
failures and a non-zero exit code:

```bash
node dist/src/cli.js validate examples/assessment.incomplete.json
```

Use the CLI in CI after copying
[`examples/assessment.production.json`](examples/assessment.production.json)
into your project and replacing the example evidence with links or repository
paths that your reviewers can inspect.

## Assessment model

Each control has a minimum maturity level. Required controls at or below the
feature's selected maturity must be present and have status `pass` or
`not_applicable`. A `not_applicable` result always needs a rationale.

Statuses are:

- `pass` — the control is met and evidence is attached;
- `partial` — some work or evidence is missing;
- `fail` — the control is not met;
- `not_applicable` — the control does not apply, with a documented reason.

Every result records an owner, rationale, review date, and evidence where the
status requires it. The schemas validate structure; the CLI additionally
checks checklist coverage, unknown control IDs, maturity gates, and review
dates.

## CLI

```text
production-ai-checklist validate <assessment.json> [--checklist <file>]
production-ai-checklist report <assessment.json> [--checklist <file>] [--output <file>]
```

Both commands validate the checklist and assessment. `validate` prints a short
summary. `report` writes Markdown to standard output unless `--output` is
provided. Validation errors and unmet required controls exit non-zero.

## Customize the checklist

[`checklist/checklist.json`](checklist/checklist.json) is the default opinionated
definition. You can provide another definition with `--checklist`; validate it
against [`schemas/checklist.schema.json`](schemas/checklist.schema.json).
Assessment files use
[`schemas/assessment.schema.json`](schemas/assessment.schema.json).

Schema identifiers are versioned. Breaking schema changes will receive a new
major identifier and release.

## Templates

- [AI feature brief](templates/ai-feature-brief.md)
- [Evaluation plan](templates/evaluation-plan.md)
- [System card](templates/system-card.md)
- [Launch review](templates/launch-review.md)
- [Incident runbook](templates/incident-runbook.md)

## Development

```bash
npm ci
npm test
npm run typecheck
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and
[SUPPORT.md](SUPPORT.md). Licensed under [Apache-2.0](LICENSE).
