-- Link kitchen tickets to a completed POS sale

alter table public.kitchen_orders
  add column if not exists transaction_id text,
  add column if not exists order_ref text;
