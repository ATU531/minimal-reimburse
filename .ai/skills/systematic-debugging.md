# Skill Name

Systematic Debugging

## Applicable Scenarios

- Bug reports
- Regressions
- Unexpected behavior with unclear cause
- Failing tests or runtime errors that do not yet have a confirmed root cause

## Core Goal

Find and fix the real root cause through evidence-driven debugging instead of trial-and-error edits.

## Operating Rules

- Define the symptom before proposing fixes
- Generate hypotheses before changing code
- Use the fastest reliable experiments to narrow the cause
- Collect evidence first, modify code second
- Apply the smallest safe fix once the root cause is known
- Verify the fix by reproducing the original case

## Procedure

1. Describe the observed symptom precisely:
   - where it happens
   - when it happens
   - expected behavior
   - actual behavior
2. Gather current evidence:
   - logs
   - test failures
   - inputs
   - environment conditions
   - recent related changes if known
3. List plausible root-cause hypotheses.
4. Design targeted checks or experiments to distinguish the hypotheses.
5. Run the checks and record evidence.
6. Identify the most likely root cause supported by evidence.
7. Implement the smallest fix that addresses that cause.
8. Reproduce the original failure scenario.
9. Verify the fix and check for nearby regressions.

## Output Requirements

The output must include:

- Symptom
- Suspected Root Causes
- Evidence Collected
- Confirmed Root Cause
- Fix Applied
- Verification Performed
- Remaining Risks

Do not say the bug is fixed if the original scenario was not re-checked or otherwise strongly verified.
