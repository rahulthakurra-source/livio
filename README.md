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
- `GCS_PROJECT_ID`, `GCS_BUCKET`, `GCS_CLIENT_EMAIL`, `GCS_PRIVATE_KEY` (recommended for large plan file uploads)
- `GCS_BUCKET_LOCATION` (optional)
- `GCS_SIGNED_URL_TTL_SECONDS` (optional)
- `RESEND_API_KEY` and `RESEND_FROM` (recommended on Render)
- `RESEND_REPLY_TO` (optional)
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

The backend sends password reset codes, client invoices, and vendor contracts through either Resend or SMTP.

- Resend is recommended on Render because it avoids SMTP port restrictions.
- `SMTP_USER` and `SMTP_PASS` can be left blank for SMTP relays that do not require authentication.
- `GET /api/email/status` returns a safe readiness summary without exposing credentials.
- On startup, the backend logs whether outbound email is fully configured and which provider is active.

### Resend

Set these backend environment variables in `backend/.env` for local runs and in your Render backend service for production:

```env
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM=Livio Legacy AI <noreply@yourdomain.com>
RESEND_REPLY_TO=support@yourdomain.com
```

Verify your sending domain in Resend first, then use an address from that verified domain in `RESEND_FROM`.

### Gmail SMTP

To send through Gmail, set these backend environment variables in `backend/.env` for local runs and in your Render backend service for production:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@gmail.com
SMTP_PASS=your-16-character-google-app-password
SMTP_FROM=Livio Legacy AI <yourname@gmail.com>
SMTP_REPLY_TO=yourname@gmail.com
SMTP_REQUIRE_TLS=true
SMTP_IGNORE_TLS=false
```

Google requires an App Password for this flow. In your Google account, turn on 2-Step Verification first, then create an App Password and use that value for `SMTP_PASS`.

## Attachments

The backend can store attachment files in either Supabase Storage or Google Cloud Storage.

- Supabase Storage works for smaller files, but your project-level Supabase limits still apply.
- Google Cloud Storage is recommended for large plan files because the frontend uploads directly to Google using signed URLs instead of sending the whole file through Render.

### Google Cloud Storage

Set these backend environment variables in `backend/.env` for local runs and in your Render backend service for production:

```env
GCS_PROJECT_ID=your-google-cloud-project-id
GCS_BUCKET=livio-project-files
GCS_CLIENT_EMAIL=livio-storage@your-project-id.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GCS_BUCKET_LOCATION=US
GCS_SIGNED_URL_TTL_SECONDS=900
```

Setup notes:

- Create a Google Cloud Storage bucket first.
- Create a service account with access to that bucket.
- Store the service account email in `GCS_CLIENT_EMAIL`.
- Store the private key in `GCS_PRIVATE_KEY`, keeping the `\n` line breaks escaped exactly as shown above.
- Once these variables are set, attachment uploads automatically switch to Google signed URLs while attachment metadata remains in your existing database.
