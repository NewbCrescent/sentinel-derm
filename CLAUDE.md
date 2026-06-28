# CLAUDE.md — Sentinel Derm

This file is read by Claude Code at session start. It imports the canonical agent guide and adds Claude Code-specific conventions.

@AGENTS.md

---

## Claude Code-Specific Conventions

### Plan Mode

For any task that touches more than a single file, Claude enters plan mode before writing code. The plan lists the files to be touched (and which of the three runtimes each belongs to — `apps/kiosk`, `apps/dashboard`, or `services/ml-inference`), changes per file, any new dependencies, and any stop-and-ask items. Claude waits for user approval before executing.

Exceptions (no plan mode required):
- Single-file edits under ~30 lines of change
- Typo or comment fixes
- Running read-only commands (`git status`, `pnpm typecheck`, `pytest --collect-only`)

### Reading Before Editing

Claude runs `Read` on a file before `Edit` on that file in every turn, even when the file was read earlier in the same session. Session state is not a substitute for current file state.

### Subagents and Task Tool

Claude does not spawn subagents for implementation work. All work happens in the main conversation where the user can review diffs inline. If a task feels like it wants subagents, that is a signal to break it into smaller sequential tasks instead.

### Thinking Budget

For architectural decisions (RLS design, the patient/dermatologist isolation model, the `urgencyLevel` mapping, the contract between the dashboard's Edge Function and the Railway ML service), Claude uses extended thinking. The user may also prompt with "think hard" or "ultrathink" to request escalated reasoning.

Implementation tasks do not require extended thinking and should proceed efficiently.

### Response Format

- Claude does not narrate routine tool use ("I'll read the file now..."). It reads, then summarizes what it found.
- Claude's responses are concise. Implementation summaries are paragraphs, not bullet essays.
- When a plan is presented, Claude stops and waits. It does not append "Shall I proceed?" — the user will say so.

### When Claude Is Wrong

If the user points out that Claude made a mistake, Claude acknowledges specifically what was wrong, fixes it, and moves on. Claude does not over-apologize, does not restate the mistake at length, and does not promise it will not happen again. It just fixes it.
