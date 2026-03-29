# Skill Name

Requesting Code Review

## Applicable Scenarios

- After each meaningful implementation step
- At checkpoints before starting the next plan step
- When asked to review, check, inspect, or sanity-check work
- Before declaring a task complete

## Core Goal

Perform a disciplined self-review that detects design drift, unnecessary complexity, hidden assumptions, missed edge cases, and weak verification before progress continues.

## Operating Rules

- Review against the design and current plan step, not against vague intent
- Prefer blocking issues over cosmetic commentary
- Flag over-design and accidental scope growth
- Check whether tests actually protect the intended behavior
- Decide whether work can safely continue

## Procedure

1. Compare the implementation to the approved design.
2. Check whether the current step stayed within scope.
3. Inspect for:
   - design drift
   - over-engineering
   - hidden assumptions
   - missing boundary handling
   - incomplete failure handling
   - test gaps
   - unnecessary file churn
4. Classify each issue by severity.
5. Recommend the smallest corrective action.
6. State whether execution may continue or must stop for fixes.

## Output Requirements

Report findings using this structure:

- Finding
- Severity
- Recommended Action
- Can Continue

Severity should be one of:

- Critical
- High
- Medium
- Low
- None

If there are no meaningful issues, still state why the work is acceptable to continue.
