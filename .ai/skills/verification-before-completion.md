# Skill Name

Verification Before Completion

## Applicable Scenarios

- A task appears finished
- A fix appears to work
- A feature is ready for handoff
- Someone asks whether the work can be considered done

## Core Goal

Decide whether the work is actually complete based on evidence, coverage, and known risk. Prevent unsupported claims of completion.

## Operating Rules

- Completion requires verification evidence
- Passing implementation is not enough without requirement coverage
- Report known gaps instead of hiding them
- Separate verified facts from assumptions
- Do not say "done" or "fixed" when evidence is incomplete

## Procedure

1. List the requested outcomes and acceptance criteria.
2. Map each outcome to verification evidence.
3. Check:
   - relevant tests
   - direct behavior verification
   - edge cases
   - changed files
   - regressions or adjacent risk areas
4. Record anything still unverified.
5. State known risks, trade-offs, or manual confirmation items.
6. Decide one of:
   - complete
   - complete with known limits
   - not ready to claim completion

## Output Requirements

The output must include:

- Requirement Coverage
- Tests and Verification Evidence
- Edge Cases Checked
- Changed Files
- Known Risks
- Manual Confirmation Needed
- Completion Decision

If evidence is partial, the completion decision must explicitly say that completion cannot yet be claimed.
