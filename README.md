# UTG Digital Student Services — Clearance Platform (MVP)

> **Prototype — Not an official UTG service.**

A student clearance workflow: students register, submit a clearance with documents, pay a small
digital service fee (mock mobile money), and staff approve / reject / request corrections. Approved
students are handed off to the official UTG Students' Portal to complete course registration.

- `backend/` — Django + Django REST Framework + PostgreSQL, JWT auth (`djangorestframework-simplejwt`)
- `frontend/` — Next.js (App Router) + TypeScript + Tailwind CSS
- `docs/schema.md` — database schema; `docs/PAYMENT_MODULE_PLAN.md` — payment planning notes

## Prerequisites

Python 3.12+, Node 20+, PostgreSQL 14+.

## Backend

```bash
# 1. PostgreSQL: create a role and database (example)
sudo -u postgres psql -c "CREATE USER utg_clearance WITH PASSWORD 'choose-a-password';"
sudo -u postgres psql -c "CREATE DATABASE utg_clearance OWNER utg_clearance;"

# 2. Python environment
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 3. Configuration — every secret comes from the environment
cp .env.example .env        # then edit: DJANGO_SECRET_KEY, DB_PASSWORD, SEED_*_PASSWORD

# 4. Schema + seed data
python manage.py migrate
python manage.py seed_data  # idempotent; needs SEED_ADMIN_PASSWORD / SEED_STUDENT_PASSWORD

# 5. Run
python manage.py runserver 8000   # API at http://localhost:8000/api/
```

Quick experiments without PostgreSQL: set `DB_ENGINE=sqlite` in `.env` (not for production).

### Seeded accounts

Passwords are whatever you set in `SEED_ADMIN_PASSWORD` / `SEED_STUDENT_PASSWORD`.

| Role | Email |
| --- | --- |
| Super Admin | `superadmin@utg-demo.example` |
| Admin | `admin1@utg-demo.example`, `admin2@utg-demo.example` |
| Student | `amie.jallow@example.com`, `lamin.sanneh@example.com`, `fatou.ceesay@example.com`, `modou.bah@example.com` |

Seed data also creates 6 faculties, 8 programmes, the current academic term, 11 clearance
requirements (some faculty-specific) and the system settings.

### Tests and lint

```bash
python manage.py test      # uses DB from .env (use DB_ENGINE=sqlite for a quick run)
ruff check .
```

### Key behaviour

- **Roles**: `student`, `admin`, `super_admin`. Students log in at `/api/auth/login/`, staff at
  `/api/auth/admin-login/`. Super Admins can edit system settings and view the audit log.
- **Digital service fee** comes from the `digital_service_fee` `SystemSetting` (default GMD 50),
  changeable on `/admin/settings` (Super Admin) and snapshotted per application on submit.
- **Uploads** go through `apps/core/storage.py` (`DOCUMENT_STORAGE_BACKEND` env var, default local
  `media/`). Files are only served through the authenticated download endpoint
  (`/api/clearance/documents/<id>/download/`), never publicly. Allowed: PDF/JPG/PNG up to 5 MB.
- **Mock payment**: no provider is called. A payer number ending in `0000` simulates a failure.
  Repeat payment on an already-paid application returns the existing payment (idempotent).
- **References**: `CLR-YYYY-XXXXXX` (clearance), `PAY-YYYY-XXXXXX` (payment).
- Student registration auto-verifies the record (prototype); a real deployment must check the
  university registry.

## Frontend

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, default http://localhost:8000/api
npm install
npm run dev                  # http://localhost:3000
```

Also: `npm run lint`, `npm run typecheck`, `npm run build`.
JWTs are kept in `localStorage` (acceptable for a prototype; use httpOnly cookies for production).
Set `CORS_ALLOWED_ORIGINS` in the backend `.env` if the frontend runs on another origin.

### Pages

`/` landing · `/register` · `/login` · `/admin/login` · `/student/dashboard` (progress tracker,
handoff) · `/student/clearance` (4-step wizard) · `/student/payment` · `/student/notifications` ·
`/admin/dashboard` (search/filter) · `/admin/applications/[id]` (review + decision) ·
`/admin/settings` (Super Admin) · `/admin/notifications`.
