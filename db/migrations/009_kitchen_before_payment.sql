-- Send kitchen tickets before POS payment

alter table public.pos_orders
  add column if not exists kitchen_order_id text,
  add column if not exists sent_to_kitchen_at timestamptz;

alter table public.kitchen_orders
  add column if not exists pos_order_id text;
