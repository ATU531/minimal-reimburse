# Skill Name

Brainstorming

## Applicable Scenarios

- New features
- Large or cross-cutting changes
- Requests with unclear goals or missing constraints
- Tasks with multiple valid implementation approaches

## Core Goal

Turn an unclear or high-impact request into an explicit design that is small, testable, and ready for planning. Do not enter implementation before the design is explicit.

## Operating Rules

- Ask before building when scope or behavior is unclear
- Clarify goals, non-goals, constraints, boundaries, and acceptance criteria
- Surface assumptions instead of silently making them
- Offer options only when they materially change complexity, risk, or outcome
- Recommend the simplest viable option
- Do not produce code in this stage

## Procedure

1. Restate the request in one or two sentences.
2. Identify missing information:
   - target outcome
   - scope limits
   - constraints
   - edge cases
   - success criteria
3. Ask focused clarification questions or infer the smallest safe assumption when the gap is minor.
4. If multiple approaches are plausible, present 2 to 3 options with:
   - what changes
   - advantages
   - disadvantages
   - main risks
5. Recommend one approach based on simplicity, risk, and ease of verification.
6. Produce a design summary with:
   - goal
   - scope
   - non-goals
   - constraints
   - edge cases
   - acceptance criteria
   - chosen approach
7. Stop after design output. Do not move to coding until the design is confirmed.

## Output Requirements

The output must include these sections:

- Request Summary
- Open Questions or Assumptions
- Options
- Recommended Approach
- Design Summary
- Acceptance Criteria

The output must be concise, decision-oriented, and directly usable as input to planning.
