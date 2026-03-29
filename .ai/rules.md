# Project AI Rules

## Scope

These rules are always on for this project.

## Rules

1. Do not directly code non-trivial tasks.
2. Clarify unclear goals, scope, constraints, edge cases, and acceptance criteria first.
3. Design before planning. Plan before implementation.
4. Break implementation into small, verifiable steps.
5. Prefer TDD: failing test, minimal fix, passing test, then refactor if needed.
6. Do not debug by guesswork. Collect evidence before changing code.
7. Prefer the simplest solution that satisfies the requirement.
8. Avoid over-design, speculative abstractions, and unrelated refactors.
9. Keep changes minimal, local, and easy to verify.
10. Review each step before moving to the next one.
11. Do not say "done" or "fixed" without verification evidence.
12. Always report known risks, gaps, and unverified areas.

## Default Routing

- New feature or unclear request: use `brainstorming`
- Confirmed design: use `writing-plans`
- Implementation step: use `test-driven-development`
- Review request or checkpoint: use `requesting-code-review`
- Bug report: use `systematic-debugging`
- Completion check: use `verification-before-completion`
