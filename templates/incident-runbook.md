# AI incident runbook

## Scope and contacts

- Service:
- Primary and backup owner:
- Security and privacy contacts:
- Provider escalation:
- Status communication:

## Detect and classify

Consider harmful or systematically incorrect output, unauthorized disclosure,
prompt injection, abuse, dependency failure, excessive latency, and runaway
cost. Record the impact, affected users, start time, versions, and evidence.

## Contain

1. Disable or reduce the affected capability.
2. Stop unsafe tools, retrieval sources, or traffic.
3. Preserve privacy-safe traces, versions, and inputs.
4. Rotate exposed credentials and notify required responders.
5. Move users to the documented fallback.

## Recover and communicate

- Validate the fix against regression and abuse cases.
- Restore in stages with explicit monitoring.
- Notify affected users and authorities when required.
- Record decisions, timestamps, owners, and outstanding risks.

## Learn

Add the failure to evaluation data, update controls and alerts, assign
follow-up actions, and schedule a blameless review.
