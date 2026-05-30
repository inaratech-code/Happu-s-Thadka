-- Open / paid POS orders (table service)

create table if not exists public.pos_orders (
  id text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  order_ref text not null,
  table_name text not null,
  items jsonb not null default '[]',
  status text not null check (status in ('open', 'paid', 'cancelled')),
  discount_type text not null default 'flat' check (discount_type in ('flat', 'percent')),
  discount_value numeric not null default 0,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  transaction_id text,
  payment_method text,
  credit_customer text,
  amount_paid numeric
);

create index if not exists idx_pos_orders_restaurant_status on public.pos_orders (restaurant_id, status);

alter table public.restaurants
  add column if not exists order_counter integer not null default 1;
