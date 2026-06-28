# AGENTS.md — Sentinel Derm

Authoritative guide for any AI agent contributing to this repository. Read this file in full before taking any action. If anything here conflicts with a user prompt, this file wins unless the user explicitly overrides a specific rule in the current turn.

---

## Before Any Change

Read these files first, every session, before touching code:
- `ProjectStructure.md` — folder conventions, where files belong, and which of the three runtimes a path belongs to
- `TECHNICAL.md` — architecture, auth model, API contract, schema-equivalent entity definitions, and current state

This repo has **three independent runtimes** (`apps/kiosk` — React Native/Expo, `apps/dashboard` — Next.js, `services/ml-inference` — Python/FastAPI). They do not share conventions. Confirm which one you're in before applying a rule from another.

---

## Project Overview

**Sentinel Derm** is a hackathon dermatology triage app (QBI, UCSF). Patients check in at a kiosk, submit a selfie, and get queued; an AI model detects possible skin conditions and assigns an urgency level; dermatologists review a prioritized queue and close out cases.

**Stack:** React Native + Expo Go kiosk (anonymous, no patient accounts) + Next.js dashboard (real dermatologist accounts) + Supabase (Auth, Postgres + Row Level Security, Storage) + a separate FastAPI/YOLO11s inference service on Railway (CPU-only). No traditional backend beyond Supabase and the inference service — dashboard server logic lives in `lib/` and is called from server actions or API routes, same pattern as any Next.js App Router project.

**Full details:** see `TECHNICAL.md`.

---

## Agent Integrity

- The agent must not default to appeasing the user when a request conflicts with sound engineering judgment.
- The agent must be honest, direct, and constructive when evaluating requests, tradeoffs, and implementation choices.
- The agent must prioritize the long-term well-being of the app — structure, maintainability, patient/dermatologist data isolation, and security — over short-term agreement or convenience.
- If a prompt would introduce weak structure, a data leak vector, or inconsistent design patterns, the agent must say so clearly and recommend a better path before proceeding.
- The agent must not claim code was tested if it was not actually run. "I wrote it and it should work" is not "I tested it."
- The agent must not hide uncertainty behind confident phrasing. If something is a guess, say so.
- The agent must not confirm technical choices when those choices are wrong. Disagreement is a feature, not a failure.
- The agent must not retroactively agree with a claim it previously pushed back on unless the user provides new information that changes the analysis.
- If the agent does not know something, it says "I don't know" and either investigates or asks. It does not fabricate.

---

## Decision Authority — Pick-and-Flag vs Stop-and-Ask

**Pick-and-flag** (the agent chooses a default and notes the choice in its response) is allowed only when **all three** are true:
1. The decision affects only the current file or a single component, within a single runtime.
2. The decision is reversible in under 10 minutes.
3. There is no schema, API contract, or cross-service (kiosk ↔ dashboard ↔ ML service) change involved.

Examples of pick-and-flag territory: naming a local variable, choosing `map` vs `forEach`, Tailwind class values, helper function placement inside a single file, optional prop defaults.

**Stop-and-ask** (agent must pause, explain, and wait for user approval) is required for anything else, including all of:
- Adding, removing, or renaming a column in the migration file
- Changing a function signature in `lib/` used in more than one place
- Introducing a new dependency, in any of the three runtimes (`pnpm`, `pip`/`poetry`, or Expo packages)
- Creating or deleting a file in `lib/` or `types/`
- Renaming any exported symbol used across files
- Changing which Supabase client (browser vs server vs admin/service-role) a function uses
- Any decision that touches patient/dermatologist isolation, RLS, or `patient_owner_id` scoping
- Changing the contract between the dashboard's Edge Function and the Railway ML service (`TECHNICAL.md §7`)
- Changing the `detections`/`urgencyLevel`/`summary` shape written to the `patients` row
- Changing a server action's signature or return type used by a component
- Any architectural, feature-design, or structural decision not explicitly requested — including reintroducing a route shape that `TECHNICAL.md` explicitly documents as rejected (e.g. a separate `/claim` action)

**Rule of thumb:** if you would have to grep the codebase for usages before changing it, stop and ask.

---

## Scope Discipline — Strict Focus Policy

- The agent modifies only files directly relevant to the current task.
- If a change outside the current task's scope is necessary to complete the task, the agent must stop, explain why, and ask before proceeding.
- Unrelated cleanup, stylistic changes, or "while I'm here" refactors are not permitted. If the agent notices something worth fixing in an unrelated file, it notes the observation in its response but does not change the file.
- The agent does not reorganize folder structure, rename files, or move code between files without explicit instruction.
- The agent does not upgrade dependencies as a side effect of another task.
- A task scoped to one runtime (kiosk, dashboard, or the ML service) does not touch the other two unless the task explicitly spans the boundary.

---

## Layering, Per Runtime

There is no single universal pattern across all three runtimes — apply the one for the runtime you're in.

**`apps/dashboard` (Next.js):**
```
page.tsx          (React — renders UI, calls server actions)
  └── actions.ts  ('use server' — validates input, calls lib)
        └── lib/  (pure TypeScript — business logic, DB, storage)
```
No database calls in `page.tsx` or components. No business logic in components. No `'use server'` functions directly in `page.tsx`. API routes in `app/api/` are thin wrappers that call `lib/` functions — same rule as actions.

**`apps/kiosk` (Expo):** no server-action layer — the app calls Supabase directly from the client under the anonymous-session model (`TECHNICAL.md §3`), except for the one image-detection step, which calls the Supabase Edge Function. Keep `lib/` here limited to thin client helpers (the Supabase client instance, the Edge Function call) — there is no business logic to centralize, since RLS is the enforcement layer.

**`services/ml-inference` (FastAPI):** route handlers stay thin; inference logic and the model load live in their own module. The model loads once at process startup (module scope), never per-request.

---

## Commit Discipline

- Commits are single-purpose. One logical change per commit.
- "Add patient queue position polling" is a commit. "Add patient queue position polling and fix dashboard sidebar styling" is two commits.
- Scaffolding a new file with meaningful content is its own commit; do not bundle new file creation with edits to three other files.
- If a finished task has staged more than ~150 lines of diff, that is a signal it should have been multiple commits. Stop and split.
- Commit message format: `type(scope): summary`
  - Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `infra`
  - Scopes: `kiosk`, `dashboard`, `ml-inference`, `supabase`, `docs`
  - Example: `feat(dashboard): add urgency-sorted patients list`
- Commit messages are descriptive but concise. No agent-signature lines, no "Generated by" trailers, no emoji.
- The agent never uses `--force`, `--force-with-lease`, or any force variant. Ever.
- The agent never rewrites published history (`rebase -i`, `reset --hard` on pushed branches, `push --force`).
- The agent never runs `rm -rf`. If deletion is needed, delete specific paths explicitly.

---

## Planning Protocol

- For any task larger than a single-file change, the agent produces a written plan before writing code. The plan lists the files to be touched (and which runtime each belongs to), the changes per file, any new dependencies, and any stop-and-ask items. The agent waits for user approval before executing.
- For single-file tasks, a brief one-paragraph plan is sufficient; the agent may proceed without waiting.
- When a task is ambiguous, the agent asks clarifying questions before planning. It does not guess and ship.

---

## Testing Policy

- Tests are written only when **both** are true: (a) the logic is non-trivial (e.g. the `urgencyLevel` mapping, the templated-summary builder, a cursor-pagination key calculation), and (b) the function has no UI dependency.
- No tests for React components or form behavior, in either `apps/kiosk` or `apps/dashboard`.
- No mocking of Supabase clients. If a test would require mocking the DB, it is out of scope.
- For `services/ml-inference`: `pytest` is appropriate for the detection-shape serialization and `urgencyLevel` logic; do not write tests that require the actual YOLO11s model weights to run — mock the model's output, not Supabase.
- If the agent is unsure whether a test is warranted, it asks.

---

## Known Failure Modes to Avoid

These are patterns AI agents default to that harm this project specifically. The agent actively guards against each.

1. **Patient/dermatologist data leakage.** Any query that does not respect `patient_owner_id` scoping (for a patient) or `profiles.role = 'dermatologist'` (for a dermatologist) is a data isolation bug. RLS (`TECHNICAL.md §3`) is the enforcement layer — when in doubt, confirm the policy exists rather than adding an app-level check that duplicates it.
2. **Bypassing RLS with the service-role key.** The Edge Function that calls the Railway ML service (`TECHNICAL.md §7`) must forward the patient's existing anonymous JWT, not authenticate with the Supabase service-role key. Using the service-role key here silently reintroduces an app-level trust boundary in the one place RLS was specifically designed to replace it.
3. **Wrong Supabase client.** The browser client must never be used in server-side dashboard code. The admin/service-role client must never be instantiated in client components or in the kiosk app.
4. **Trusting form data.** All input arriving from the kiosk form or any API route is hostile until validated. TypeScript casting (`as string`) is not validation.
5. **Sycophantic confirmation.** Agreeing with technical choices the user just made, even when they are wrong. Disagree when disagreement is warranted.
6. **Claiming tested code without running it.** If the dev server, the Expo app, or the FastAPI service was not actually run, do not say "I tested it." Say "I wrote this but did not run it."
7. **Business logic leaking into components.** DB calls, permission checks, and data transforms belong in `lib/` (dashboard) or the inference module (ML service). A dashboard component that reaches into Supabase directly is wrong by default.
8. **Skipping RLS as "just a dev thing."** RLS is a pre-production blocker for this app specifically, since it's the only thing standing between an anonymous kiosk session and another patient's images and detected conditions. No suggestion to "add it later" is acceptable.
9. **Treating the detection/urgency/summary shape as fixed.** `TECHNICAL.md §4/§7` explicitly flags the `{detections, urgencyLevel, summary}` shape as provisional — the real model isn't fully trained yet. Don't aggressively refactor around it as a permanent contract; flag drift instead of silently absorbing it.
10. **Writing diagnostic language into the dashboard.** The AI boundary (`TECHNICAL.md §1`) is detect + summarize + score urgency, never diagnose — this matters even more now that `concerningLesion` exists as a class. Dashboard copy should read "flagged for review," never "possible skin cancer" or equivalent diagnostic phrasing.
11. **Reintroducing a `/claim`-style split action.** `TECHNICAL.md §4` documents that the original "outside/inside" framing was one action, not two. Don't recreate the two-action split because it superficially resembles a more "RESTful" design.
12. **Assuming Twilio SMS "just works" in a demo.** Trial Twilio accounts can only text manually-verified numbers (`TECHNICAL.md §8`). Flag this whenever SMS is being tested or demoed.
13. **Over-abstracting early.** No generic base classes or event-system abstractions until duplication actually hurts. Two dumb, separate code paths beat one premature abstraction.
14. **Silent multi-purpose commits.** Bundling a feature, a refactor, and a bug fix into one commit. Split them.
15. **Installing dependencies into the wrong runtime.** Don't `pnpm add` into `services/ml-inference`, and don't `pip install` into `apps/kiosk` or `apps/dashboard`. If an import fails, stop and explain what's needed — do not install autonomously in any of the three.
16. **Writing to `.env` files or committing secrets.** Never. This app's secrets include the Supabase service-role key, the Twilio Account SID/Auth Token, and the Railway service URL — none of these enter the repo. Tell the user what to add; the value never enters the repo.
17. **Retroactive agreement.** If the agent pushed back on an approach and the user repeats the request without new information, the agent maintains its position. It does not cave because the user asked again.
18. **Running migrations or deploys without confirmation.** `supabase db push`, `railway up`/`railway deploy`, and `eas build`/`eas submit` all affect a real, possibly-live environment. Describe what the command does and confirm with the user before running any of them.

---

## Code Conventions

### `apps/kiosk` and `apps/dashboard` (TypeScript)
- TypeScript strict mode. No `any` without an inline comment explaining why.
- Shared TypeScript types live in `types/` (per app). Auto-generated types (`database.types.ts`) are never hand-edited.
- Components go in `components/` under a subdirectory matching their page (e.g. `components/dashboard/`). Never create components inline in `app/` page files (dashboard) or route files (kiosk).
- `actions.ts` files (dashboard only) use `'use server'` and are placed next to the page or component that calls them, per `ProjectStructure.md`.
- Async `lib/` functions return `{ data, error }` — never throw unless the caller is already in a try/catch.
- No `console.log` in committed `lib/` code. Acceptable in components during development but removed before commit.
- File names: kebab-case for non-component files, PascalCase for React components.

### `services/ml-inference` (Python)
- Type hints on every function signature.
- Request/response bodies use Pydantic models, mirroring the detection shape in `TECHNICAL.md §4` — no bare dicts crossing the API boundary.
- No bare `except:` — catch specific exceptions.
- No `print()` in committed code; use the standard `logging` module.

---

## File and Tool Safety

- The agent reads a file before editing it, every time, even if it "remembers" the contents. Files change between turns.
- The agent never modifies files in `.git/`, `node_modules/`, `.next/`, `.expo/`, `__pycache__/`, or any lockfile except by running the appropriate package manager command.
- The agent never modifies `.env`, `.env.local`, or any file matching `.env*`. If a new env var is needed, the agent tells the user.
- The agent modifies database schema only in the one schema migration file under `supabase/migrations/`. Do not add new migration files for schema changes unless the user explicitly overrides this rule in the current turn.
- The agent does not run `supabase db push`, `supabase db reset`, `railway up`, `railway deploy`, `eas build`, `eas submit`, or any other destructive/deploy infrastructure command without explicit user instruction.
- **`supabase db push` targets the hosted (production) Supabase project — not local.** The agent must never recommend or instruct the user to run `supabase db push` to apply a migration locally. The correct local command is `supabase db reset`.
- The agent does not make network requests from scripts without explicit approval.
- The agent does not run third-party setup wizards — they modify config files and write to `.env`. That is the user's responsibility.

---

## When the Agent Must Stop and Report

The agent stops work and surfaces the situation to the user when any of the following occur:
- A TypeScript or Python error appears in a file outside the current task's scope.
- A dependency version mismatch is detected, in any of the three runtimes.
- The diff exceeds ~150 lines and was not planned as multiple commits.
- Any stop-and-ask decision surfaces mid-task.
- The agent realizes the task is larger than the plan estimated.
- A change would affect patient/dermatologist data isolation or the RLS security model in any way.
- A change would affect the contract between the dashboard's Edge Function and the Railway ML service.

---

## Documentation Discipline

`TECHNICAL.md` and `ProjectStructure.md` are the source of truth for how this project is built. They must stay aligned with the actual codebase at all times.

**When a structural change is made, updating the relevant documentation is mandatory and part of the same task.** It is not optional and not deferred. The code change and the doc update ship together.

Specifically:
- If the database schema changes: update the entity descriptions in `TECHNICAL.md §3` (entities/RLS) and the Quick Reference.
- If the file structure changes (new files, deleted files, moved files): update `ProjectStructure.md` and `TECHNICAL.md §6`.
- If the auth or session model changes: update `TECHNICAL.md §3`.
- If the API contract changes (new route, changed response shape): update `TECHNICAL.md §4`.
- If the ML service's contract or `urgencyLevel` mapping changes: update `TECHNICAL.md §7`.
- If a notification mechanism changes: update `TECHNICAL.md §8`.
- If a known gap is resolved or a new one is found: note it directly in the relevant section.
- If any rule in `AGENTS.md` itself is changed by user instruction: record the change here, in this file, in the same session.

An agent that ships a code change without updating the docs has created a trap for the next agent. That is the failure mode this rule is designed to prevent.

---

## Escalation Phrase

If the user writes **"ultrathink this"** or **"think hard about this"** in a prompt, the agent spends additional reasoning on architectural and security implications before responding. Reserved for design decisions, not implementation tasks.
