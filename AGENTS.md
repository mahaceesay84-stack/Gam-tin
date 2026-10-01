# AGENTS.md

UTG Digital Student Services clearance prototype. See `README.md` for setup, `docs/schema.md` for the data model.

## Layout
- `backend/` Django/DRF (apps under `backend/apps/`, business rules in each app's `services.py`).
- `frontend/` Next.js App Router + Tailwind; API client in `frontend/src/lib/api.ts`.

## Commands
- Backend tests: `cd backend && DB_ENGINE=sqlite python manage.py test` (needs `backend/.env`, see `.env.example`).
- Backend lint: `ruff check .` in `backend/`.
- Frontend: `npm run lint`, `npm run typecheck`, `npm run build` in `frontend/`.

## Gotchas
- Secrets only via env vars; never commit `.env`. `seed_data` requires `SEED_*_PASSWORD`.
- Fee comes from `SystemSetting` (`digital_service_fee`), never hardcoded.
- The eslint `react-hooks/set-state-in-effect` rule is on: fetch inside effects with `.then(...)`, not via helper that sets state synchronously.
- The `venv/` at the repo root is untracked tooling; the repo has no remote DB, so tests use sqlite.

## Maintaining this file
Keep it short and project-intrinsic: record only knowledge useful to nearly every session, and point to authoritative files instead of copying detail. Update it when commands or conventions change.
