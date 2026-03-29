# Livio Backend

This repository contains the Render-ready backend for Livio.

## Stack

- Node.js
- Express
- Supabase

## Environment

Create `backend/.env` from `backend/.env.example` and set:

- `PORT`
- `FRONTEND_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_REPLY_TO` (optional)
- `SMTP_REQUIRE_TLS` (optional)
- `SMTP_IGNORE_TLS` (optional)

## Run locally

```bash
cd backend
npm install
npm run dev
```

## Database setup

Run `backend/sql/001_create_tables.sql` in Supabase.

If you need to migrate from the old `app_state` JSON snapshot, also run `backend/sql/002_migrate_projects_from_app_state.sql`.

## API

- `GET /api/health`
- `GET /api/email/status`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `GET /api/projects`
- `GET /api/projects/template`
- `GET /api/projects/:projectId`
- `POST /api/projects`
- `PUT /api/projects/:projectId`
- `DELETE /api/projects/:projectId`
- `POST /api/client-invoices/email`
- `POST /api/vendor-contracts/email`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:userId`
- `DELETE /api/users/:userId`

## Email

The backend sends password reset codes, client invoices, and vendor contracts through SMTP.

- `SMTP_USER` and `SMTP_PASS` can be left blank for SMTP relays that do not require authentication.
- `GET /api/email/status` returns a safe readiness summary without exposing credentials.
- On startup, the backend now logs whether outbound email is fully configured.
