insert into projects (
  id,
  name,
  street,
  city,
  county,
  state,
  zip,
  address,
  permit,
  apn,
  type,
  color,
  data,
  updated_at
)
select
  coalesce(project_item->>'id', 'proj_' || md5(random()::text)) as id,
  coalesce(project_item->>'name', 'Untitled Project') as name,
  coalesce(project_item->>'street', '') as street,
  coalesce(project_item->>'city', '') as city,
  coalesce(project_item->>'county', '') as county,
  coalesce(project_item->>'state', 'CA') as state,
  coalesce(project_item->>'zip', '') as zip,
  coalesce(project_item->>'address', '') as address,
  coalesce(project_item->>'permit', '') as permit,
  coalesce(project_item->>'apn', '') as apn,
  coalesce(project_item->>'type', '') as type,
  coalesce(project_item->>'color', '#1A6BC4') as color,
  (
    project_item
    - 'id'
    - 'name'
    - 'street'
    - 'city'
    - 'county'
    - 'state'
    - 'zip'
    - 'address'
    - 'permit'
    - 'apn'
    - 'type'
    - 'color'
    - 'createdAt'
    - 'updatedAt'
  ) as data,
  now() as updated_at
from app_state,
jsonb_array_elements(payload->'db'->'projects') as project_item
on conflict (id) do update
set
  name = excluded.name,
  street = excluded.street,
  city = excluded.city,
  county = excluded.county,
  state = excluded.state,
  zip = excluded.zip,
  address = excluded.address,
  permit = excluded.permit,
  apn = excluded.apn,
  type = excluded.type,
  color = excluded.color,
  data = excluded.data,
  updated_at = now();
