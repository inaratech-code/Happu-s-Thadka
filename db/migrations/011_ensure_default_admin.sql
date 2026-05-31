-- Restore default admin if staff was accidentally wiped (e.g. empty state sync before login).
insert into public.staff (id, restaurant_id, name, username, password_hash, role, permissions, active, created_at)
select
  'admin-default',
  'rest-happus-tadka',
  'Admin',
  'admin',
  'sha256:1b7c28130c4cd4ce18cf41d28fca82a8d98daf7e5b2e8a054a3daab0fa543170',
  'admin',
  array[]::text[],
  true,
  '2020-01-01T00:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.staff where restaurant_id = 'rest-happus-tadka'
);
