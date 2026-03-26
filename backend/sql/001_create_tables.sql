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
