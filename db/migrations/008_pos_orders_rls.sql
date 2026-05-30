-- RLS for pos_orders (table added in 007)

alter table public.pos_orders enable row level security;
alter table public.pos_orders force row level security;
drop policy if exists pos_orders_tenant on public.pos_orders;
create policy pos_orders_tenant on public.pos_orders
  for all
  using (restaurant_id = app_current_restaurant_id())
  with check (restaurant_id = app_current_restaurant_id());
