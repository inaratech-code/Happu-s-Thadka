-- Multi-tenant routing: subdomain slug -> tenant -> restaurant
drop table if exists tenants;

create table tenants (
  id text primary key,
  slug text not null unique,
  name text not null,
  restaurant_id text not null unique references public.restaurants (id) on delete cascade,
  created_at timestamptz not null default now()
);

insert into tenants (id, slug, name, restaurant_id)
values (
  'tenant-happus',
  'happus',
  'Happus Tadka',
  'rest-happus-tadka'
)
on conflict (slug) do nothing;
