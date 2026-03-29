# Skill Name

Test-Driven Development

## Applicable Scenarios

- Starting an implementation step with observable behavior
- Fixing a bug with a reproducible case
- Adding validation, parsing, state transitions, calculations, or reusable logic
- Any change where tests can express the intended behavior

## Core Goal

Implement behavior through the RED-GREEN-REFACTOR cycle so that changes are evidence-backed, minimal, and safe to evolve.

## Operating Rules

- State the target behavior before changing code
- Write or update a test first whenever practical
- Confirm the test fails for the expected reason
- Implement the smallest change that makes the test pass
- Refactor only after behavior is protected
- Do not claim success without test or equivalent verification evidence

## Procedure

1. Define the target behavior in concrete terms.
2. Identify the narrowest test that proves the behavior.
3. Add or update the test.
4. Run the relevant test set and confirm failure:
   - verify the failure is real
   - verify the failure matches the intended behavior gap
5. Implement the smallest possible production change.
6. Re-run the relevant tests and confirm they pass.
7. Refactor only if it improves clarity, removes duplication, or aligns with existing structure.
8. Re-run tests after any refactor.
9. Record changed files and remaining risks.

## Output Requirements

The output must include:

- Target Behavior
- Added or Updated Tests
- Confirmed Failure and Why It Failed
- Minimal Implementation
- Passing Verification
- Changed Files
- Remaining Risks or Follow-up

If TDD is not practical, the output must explicitly say why and provide the strongest available alternative verification.
