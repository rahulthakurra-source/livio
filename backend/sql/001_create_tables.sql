create table if not exists projects (
  id text primary key,
  name text not null,
  street text,
  city text,
  county text,
  state text,
  zip text,
  address text,
  permit text,
  apn text,
  type text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index if not exists projects_updated_at_idx on projects (updated_at desc);

create table if not exists attachments (
  id text primary key,
  project_id text references projects(id) on delete cascade,
  name text not null,
  size bigint not null default 0,
  content_type text,
  bucket text not null,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists attachments_project_id_idx on attachments (project_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files',
  'project-files',
  false,
  52428800,
  array['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

create table if not exists app_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists app_users (
  id text primary key,
  username text unique not null,
  password text not null,
  role text not null,
  email text
);

insert into app_users (id, username, password, role, email)
values
  ('u1', 'admin', 'livio2026', 'Admin', 'admin@liviobuilding.com'),
  ('u2', 'manager', 'manager123', 'Manager', 'manager@liviobuilding.com')
on conflict (id) do nothing;
