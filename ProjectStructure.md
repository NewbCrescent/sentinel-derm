# Repo layout

This is a monorepo with **three independent runtimes** under one pnpm workspace (the Python service isn't part of the pnpm graph, but lives in the same repo). Check which app/service you're in before assuming a convention from another — they don't all share the same patterns.

```
sentinel-derm/
├── AGENTS.md
├── CLAUDE.md
├── ProjectStructure.md      ← this file
├── TECHNICAL.md             ← architecture, auth model, API contract, schema-equivalent info
├── package.json             ← workspace scripts
├── pnpm-workspace.yaml      ← apps/*
├── apps/
│   ├── kiosk/               ← React Native + Expo Go, patient-facing
│   └── dashboard/           ← Next.js (App Router), dermatologist-facing
├── services/
│   └── ml-inference/        ← FastAPI + Ultralytics YOLO26m (classification), deployed to Railway
└── supabase/
    └── migrations/          ← one .sql file defines the schema (see AGENTS.md)
```

---

# apps/kiosk (React Native + Expo Go)

Patient-facing. Runs on a shared, unauthenticated device — every screen operates inside one anonymous Supabase session per patient (`TECHNICAL.md §3`). No server actions, no `lib/` layer of its own — this app talks to Supabase directly from the client for everything except the one image-detection step, which hits the Supabase Edge Function described in `TECHNICAL.md §7`.

- File-based routing (Expo Router). The two logical pages from `TECHNICAL.md §6` map directly: `index` (entry/check-in form) and `capture` (selfie). The current Figma kiosk section has seven iPad storyboard frames; those are wizard states inside these two routes, not seven separate Expo Router pages.
- `lib/` inside this app is for thin client helpers only (the Supabase client instance, the one Edge Function call) — there is no business logic to centralize here, since RLS is the enforcement layer, not app code.
- Do not add authentication UI, account screens, or persisted sessions here. The anonymous-session-per-visit model (`TECHNICAL.md §3`) is deliberate; "add a login screen" is a Stop-and-Ask architectural change, not a kiosk bug fix.

Current layout:
```
apps/kiosk/
├── app/
│   ├── _layout.tsx       ← Expo Router stack; no business logic
│   ├── index.tsx         ← renders the check-in wizard
│   └── capture.tsx       ← renders the photo capture flow
├── components/kiosk/
│   ├── CaptureFlow.tsx   ← photo guidance, camera, review, done states
│   ├── CheckInWizard.tsx ← welcome, identity, reason/notes wizard states
│   ├── KioskShell.tsx    ← shared patient-facing screen shell
│   └── PrimaryButton.tsx ← shared button primitive
├── lib/
│   ├── patient-session.ts ← thin Supabase calls for anonymous session, patient row, storage, Edge Function
│   └── supabase.ts        ← lazy Supabase client using Expo public env vars
├── theme/
│   └── colors.ts          ← native semantic color palette
├── types/
│   └── patient.ts         ← kiosk-local patient form/session types
├── app.json
├── babel.config.js
├── expo-env.d.ts
├── package.json
└── tsconfig.json
```

# apps/dashboard (Next.js, App Router)

Dermatologist-facing. Real Supabase accounts, gated by `profiles.role = 'dermatologist'`.

Follows the same three-layer pattern as any Next.js App Router project:
```
app/.../page.tsx     (React — renders UI, calls server actions)
  └── actions.ts     ('use server' — validates input, calls lib)
        └── lib/     (pure TypeScript — business logic, DB, storage)
```
- No database calls in `page.tsx` or components.
- No business logic in components.
- API routes in `app/api/` are thin wrappers that call `lib/` functions — same rule as actions.
- The logical pages in `TECHNICAL.md §6` map onto App Router paths as: `signup` → `app/signup/page.tsx`, `login` → `app/login/page.tsx`, `dashboard` → `app/dashboard/page.tsx`, `dashboard/patients` → `app/dashboard/patients/page.tsx`, `dashboard/patients/{patientID}` → `app/dashboard/patients/[patientID]/page.tsx`.
- Components go in `components/` under a subdirectory matching their page (e.g. `components/dashboard/`). Never create components inline in `app/` page files.
- Shared TypeScript types live in `types/`. Auto-generated types (`database.types.ts`) are never hand-edited.

# services/ml-inference (Python, FastAPI)

The only non-JS/TS piece of the repo. Deployed as its own always-on service on Railway (`TECHNICAL.md §7`) — not a serverless function, not part of the pnpm workspace.

- Route handlers stay thin; the actual classification/inference logic and the YOLO26m model load belong in their own module, not inline in the route function.
- The model loads once at process startup (module scope), not per-request.
- Request/response validation uses Pydantic models — mirrors the `{label, confidence}` classification shape in `TECHNICAL.md §4` (no `box` field — this is a classifier, not a detector).
- Dependencies are managed with whatever the Python environment file is (`requirements.txt` or `pyproject.toml`) — never `pnpm add` anything here, and never `pip install` into the JS apps.

Current layout:
```
services/ml-inference/
├── app/
│   ├── main.py        ← FastAPI app; thin POST /classify + GET /health
│   ├── inference.py   ← YOLO model load (module scope) + classify()
│   ├── urgency.py     ← urgencyLevel mapping (TECHNICAL.md §7)
│   ├── summary.py     ← templated, no-LLM summary builder
│   └── schemas.py     ← Pydantic request/response models
├── tests/             ← pytest for urgency + summary (pure logic, no model/Supabase)
├── Dockerfile         ← Railway build (CPU-only torch, uvicorn on $PORT)
├── .dockerignore
├── railway.json       ← Railway builder + /health healthcheck
├── best.pt            ← trained YOLO classification weights (committed)
└── requirements.txt
```

# supabase/

Shared backend config and CLI-generated code.

# supabase/migrations

One `.sql` file defines the schema — `patients`, `profiles`, `notes`, plus the RLS policies from `TECHNICAL.md §3`. Do not add a second migration file for schema changes; see `AGENTS.md`.
