# Agent Skills Guide

This project includes a suite of specialized agent skills located in [`.agents/skills/`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/). These skills provide structured workflows, design vocabularies, and quality gates for AI agents and human developers collaborating on the codebase.

---

## 1. Skill Catalog & Workflows

| Skill | Category | Slash Command | Primary Purpose |
|---|---|---|---|
| [`codebase-design`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/codebase-design/SKILL.md) | Architecture | &mdash; | Defines vocabulary for deep modules (`module`, `interface`, `depth`, `seam`, `adapter`, `leverage`, `locality`). |
| [`improve-codebase-architecture`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/improve-codebase-architecture/SKILL.md) | Architecture | `/improve-codebase-architecture` | Scans for shallow modules, generates a visual HTML deepening report, and presents candidates. |
| [`domain-modeling`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/domain-modeling/SKILL.md) | Architecture | `/domain-modeling` | Maintains domain glossary (`GLOSSARY.md`) and Architectural Decision Records (`docs/adr/`). |
| [`prototype`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/prototype/SKILL.md) | Architecture | `/prototype` | Builds throwaway prototypes to explore UI ideas or state machines. |
| [`to-spec`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/to-spec/SKILL.md) | Delivery | `/to-spec` | Synthesizes conversation context and requirements into an actionable specification. |
| [`to-tickets`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/to-tickets/SKILL.md) | Delivery | `/to-tickets` | Breaks specifications into vertical slice tracer-bullet tickets with explicit blocking edges. |
| [`implement-spec`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/implement-spec/SKILL.md) | Delivery | `/implement-spec` | Orchestrates end-to-end ticket implementation across an integration branch. |
| [`tdd`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/tdd/SKILL.md) | Quality | `/tdd` | Guides test-first development through strict red-green-refactor loops at public seams. |
| [`code-review`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/code-review/SKILL.md) | Quality | `/code-review` | Executes a two-axis review: Standards (codebase style) and Spec (originating issue). |
| [`diagnosing-bugs`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/diagnosing-bugs/SKILL.md) | Debugging | `/diagnosing-bugs` | Structured diagnosis loop for reproducing and resolving hard bugs and performance regressions. |
| [`research`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/research/SKILL.md) | Research | `/research` | Gathers primary-source documentation and captures findings into markdown notes. |
| [`grilling`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/grilling/SKILL.md) | Review | `/grilling` | Relentlessly stress-tests ideas, decisions, and assumptions to discover hidden edge cases. |
| [`pr`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/pr/SKILL.md) | Delivery | `/pr` | Formulates structured Pull Request descriptions for GitHub reviews. |
| [`wizard`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/wizard/SKILL.md) | Operations | `/wizard` | Generates interactive bash scripts to walk humans through manual infrastructure cutovers. |
| [`writing-for-agents`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/writing-for-agents/SKILL.md) | Meta | `/writing-for-agents` | Guide for authoring docs, context pointers, and progressive disclosure for AI agents. |
| [`handoff`](file:///Users/amirmostafahajisadeghian/Development/Personal/fanap-vibecoding-challenge/.agents/skills/handoff/SKILL.md) | Meta | `/handoff` | Compacts conversational context into an OS-level temporary handoff document for the next session. |

---

## 2. Recommended Engineering Workflow Loop

When tackling substantial features or refactorings, follow the standard project cycle:

```text
1. Discover & Review      --> /improve-codebase-architecture
2. Specify & Contract     --> /to-spec
3. Decompose & Sequence   --> /to-tickets
4. Test-Driven Execution  --> /implement-spec /tdd
5. Quality Gate           --> /code-review
6. Session Transition     --> /handoff
```

### Phase 1: Architecture Review (`/improve-codebase-architecture`)
- Run when code feels brittle or modules become shallow pass-throughs.
- Evaluates modules against the **deletion test**: *would deleting it concentrate complexity, or just move it?*
- Outputs a self-contained visual HTML report in `$TMPDIR` rendering before/after architecture diagrams.

### Phase 2: Specification & Ticket Generation (`/to-spec` & `/to-tickets`)
- Synthesizes user goals and domain requirements into `.scratch/<feature>/spec.md`.
- Slices work into tracer-bullet vertical slice tickets in `.scratch/<feature>/issues/<NN>-<slug>.md`.
- Each ticket specifies clear acceptance criteria and explicit blocking dependencies (`Blocked by:`).

### Phase 3: Test-Driven Implementation (`/implement-spec` & `/tdd`)
- Works the frontier of unblocked tickets.
- Follows the red &rarr; green loop: tests external behavior at agreed public seams before writing implementation code.
- Commits changes and checks off criteria per ticket.

### Phase 4: Quality Review (`/code-review`)
- Verifies adherence to coding standards (no Persian comments in source code, concise English comments only).
- Ensures full backward compatibility with CLI batch mode and automated smoke test hooks (`data-testid`).

### Phase 5: Handoff (`/handoff`)
- Compacts work, open tasks, and verification state into a temporary markdown document in `$TMPDIR`.
- Enables a clean context handoff for subsequent sessions.
