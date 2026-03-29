# Skill Name

Writing Plans

## Applicable Scenarios

- The design is explicit and approved
- The work is more than a trivial edit
- The task spans multiple files, steps, or verification points

## Core Goal

Produce an implementation plan that is small-step, verifiable, dependency-aware, and easy to execute without mixing unrelated changes.

## Operating Rules

- Plan only after the design is explicit
- Keep steps small enough to verify quickly
- Prefer steps that can finish in roughly 2 to 5 minutes
- Each step should pursue one coherent change
- Include verification in every step
- Do not merge unrelated refactors into feature work

## Procedure

1. Start from the approved design and acceptance criteria.
2. Identify the smallest meaningful execution steps.
3. For each step, specify:
   - step goal
   - likely files to change
   - intended code or behavior change
   - verification method
   - dependencies or prerequisites
4. Order steps so each one unlocks the next with minimal backtracking.
5. Split any step that contains multiple unrelated concerns.
6. Call out risk points, external dependencies, or unknowns.
7. End with a clear execution starting point.

## Output Requirements

The output must include:

- Plan Summary
- Step List
- Dependencies
- Verification Strategy
- Risks or Unknowns
- First Step to Execute

Each step must include:

- Step number
- Goal
- Files
- Change target
- Verification
- Depends on

The plan must be detailed enough to implement directly and small enough to review quickly.
