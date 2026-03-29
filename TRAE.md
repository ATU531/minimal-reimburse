# AI Collaboration Workflow

## Status

This file defines the default collaboration workflow for this project. Unless the task is trivial, do not jump straight into implementation. Follow the staged workflow in this file and the detailed procedures in `.ai/rules.md` and `.ai/skills/`.

## Default Priorities

1. Correctness over speed
2. Simplicity over cleverness
3. Evidence over assumption
4. Small validated steps over large unverified changes
5. Minimal change over broad refactor

## Do Not Code Immediately When

- The request is a new feature, a non-trivial refactor, or a cross-file change
- The goal, scope, constraints, or acceptance criteria are unclear
- There are multiple valid design choices with meaningful trade-offs
- The task affects data flow, external interfaces, persistence, permissions, or user-visible behavior
- The task is a bug report without a confirmed root cause
- The task asks for completion but does not include verification evidence

## Ask Clarifying Questions When

Ask questions before implementation if any of the following is true:

- The expected behavior is ambiguous
- The boundaries of the task are unclear
- Success cannot be judged from the prompt alone
- Edge cases or failure handling are unspecified
- A hidden product decision would otherwise be guessed

If the task is simple and low risk, make the smallest reasonable assumption and state it clearly.

## Design Is Required Before Planning or Coding When

Produce a design first when:

- The task is not simple
- The request changes behavior, architecture, interfaces, or user flow
- The implementation has multiple reasonable approaches
- The task introduces new abstractions, reusable logic, or test strategy changes

The design must cover:

- Goal
- Scope and non-goals
- Constraints
- Key edge cases
- Acceptance criteria
- Recommended approach and why it is the simplest viable option

Do not start coding until the design is explicit.

## Implementation Plan Is Required When

After the design is explicit, produce an implementation plan before coding if the work is more than a trivial single edit.

The plan must:

- Break work into small, verifiable steps
- Keep each step focused on one coherent change
- Name the files likely to change
- State the goal of each step
- State how each step will be verified
- State dependencies between steps

Avoid combining unrelated edits into one step.

## TDD Default During Implementation

Use TDD whenever practical, especially for behavior changes, bug fixes, parsing, validation, calculations, state transitions, and reusable logic.

Preferred loop:

1. State the target behavior
2. Add or update a test that expresses the behavior
3. Run the test and confirm it fails for the expected reason
4. Implement the smallest change that makes the test pass
5. Re-run relevant tests
6. Refactor only if it improves clarity or removes duplication without changing behavior

If TDD is not practical, explain why and still verify behavior with the strongest available evidence.

## Review After Every Step

After each meaningful step, perform a self-review before moving on.

Review checklist:

- Does the change match the agreed design and current step?
- Is the solution simpler than alternatives?
- Is any part over-designed or premature?
- Are assumptions explicit?
- Are edge cases handled or intentionally deferred?
- Are tests focused and sufficient for the change?
- Did the change avoid unnecessary file churn?

If serious issues are found, fix them before continuing.

## Debugging Rules

For bugs, do not guess and do not patch blindly.

Required order:

1. Define the observable symptom
2. List plausible root causes
3. Design the fastest reliable checks to discriminate between them
4. Collect evidence
5. Identify the root cause
6. Apply the smallest safe fix
7. Reproduce the original case and verify the fix

Do not call a bug fixed without evidence from reproduction or targeted verification.

## Verification Before Completion

Do not claim a task is complete, fixed, or ready unless verification evidence exists.

Before declaring completion, check:

- Requirements are covered
- Relevant tests pass
- New or changed behavior is verified
- Edge cases were checked or explicitly documented
- Changed files are known and intentional
- Known risks and follow-up items are stated

If verification is incomplete, say exactly what is still unverified.

## Trigger Phrase Conventions

Use the following phrases as workflow triggers:

- "Start a new feature" => enter `brainstorming`
- "The design is approved" => enter `writing-plans`
- "Execute the first step" => enter `test-driven-development`
- "Please review this" or "Check this" => enter `requesting-code-review`
- "Fix this bug" => enter `systematic-debugging`
- "Can we wrap this up?" => enter `verification-before-completion`

Equivalent phrases in any language should map to the same workflow stage.

## Enforcement

- If a request tries to skip a necessary stage for a non-trivial task, stop and call out the missing stage
- If design is unclear, go to brainstorming
- If design is clear but the work is multi-step, go to planning
- If implementation starts, prefer TDD
- If a milestone is reached, review before continuing
- If the work appears done, verify before saying it is done

## Working Agreement

From now on, this project uses this workflow by default. Future collaboration in this repository should follow these rules unless the task is trivial and the staged process would add no value.
