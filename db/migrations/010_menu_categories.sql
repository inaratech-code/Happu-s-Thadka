-- POS menu categories (name + optional thumbnail URL)

create table if not exists public.menu_categories (
  id text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  name text not null,
  image_url text,
  sort_order integer not null default 0,
  unique (restaurant_id, name)
);

create index if not exists menu_categories_restaurant_idx on public.menu_categories (restaurant_id);

alter table public.menu_categories enable row level security;
alter table public.menu_categories force row level security;
drop policy if exists menu_categories_tenant on public.menu_categories;
create policy menu_categories_tenant on public.menu_categories
  for all
  using (restaurant_id = app_current_restaurant_id())
  with check (restaurant_id = app_current_restaurant_id());
