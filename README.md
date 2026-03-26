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

- `POST /api/auth/login`
- `GET /api/projects`
- `GET /api/projects/template`
- `GET /api/projects/:projectId`
- `POST /api/projects`
- `PUT /api/projects/:projectId`
- `DELETE /api/projects/:projectId`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:userId`
- `DELETE /api/users/:userId`
