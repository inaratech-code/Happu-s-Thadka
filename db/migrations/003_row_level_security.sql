-- Row-level isolation: each request must set app.restaurant_id via set_config.

create or replace function app_current_restaurant_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.restaurant_id', true), '');
$$;

-- restaurants
alter table public.restaurants enable row level security;
alter table public.restaurants force row level security;
drop policy if exists restaurants_tenant on public.restaurants;
create policy restaurants_tenant on public.restaurants
  for all
  using (id = app_current_restaurant_id())
  with check (id = app_current_restaurant_id());

-- tenant-scoped tables
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'restaurant_tables',
    'staff',
    'inventory_items',
    'transactions',
    'financial_accounts',
    'parties',
    'ledger_entries',
    'stock_movements',
    'kitchen_orders'
  ]
  loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('alter table public.%I force row level security', tbl);
    execute format('drop policy if exists %I_tenant on public.%I', tbl, tbl);
    execute format(
      'create policy %I_tenant on public.%I for all
         using (restaurant_id = app_current_restaurant_id())
         with check (restaurant_id = app_current_restaurant_id())',
      tbl,
      tbl
    );
  end loop;
end $$;

-- tenants: read-only registry for workspace lookup (no restaurant_id column)
alter table public.tenants enable row level security;
alter table public.tenants force row level security;
drop policy if exists tenants_read on public.tenants;
create policy tenants_read on public.tenants
  for select
  using (true);
drop policy if exists tenants_write on public.tenants;
create policy tenants_write on public.tenants
  for all
  using (false)
  with check (false);
