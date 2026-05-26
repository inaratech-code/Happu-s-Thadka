-- Happus Tadka — initial schema (custom staff auth via Next.js API + Neon)

create extension if not exists "pgcrypto";

create table if not exists public.restaurants (
  id text primary key,
  name text not null,
  location text not null default '',
  kot_counter integer not null default 1000,
  tx_counter integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_tables (
  id text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  name text not null
);

create table if not exists public.staff (
  id text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  name text not null,
  username text not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'staff')),
  permissions text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (restaurant_id, username)
);

create table if not exists public.inventory_items (
  id text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  name text not null,
  category text not null default '',
  stock_on_hand numeric not null default 0,
  unit text not null default 'pcs',
  avg_cost numeric not null default 0,
  selling_price numeric not null default 0,
  reorder_at numeric not null default 0,
  item_type text not null check (item_type in ('sellable', 'consumable'))
);

create table if not exists public.transactions (
  id text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  tx_type text not null check (tx_type in ('sale', 'purchase', 'expense')),
  description text not null,
  amount numeric not null,
  tx_date date not null,
  category text
);

create table if not exists public.financial_accounts (
  id text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('cash', 'bank', 'digital', 'other')),
  opening_balance numeric not null default 0,
  active boolean not null default true
);

create table if not exists public.parties (
  id text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  name text not null,
  party_type text not null check (party_type in ('supplier', 'customer', 'other')),
  phone text,
  note text,
  active boolean not null default true
);

create table if not exists public.ledger_entries (
  id text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  entry_date date not null,
  description text not null,
  debit numeric not null default 0,
  credit numeric not null default 0,
  account_id text,
  party text,
  payment_method text check (payment_method in ('cash', 'qr', 'bank', 'card')),
  kind text check (kind in ('receipt', 'payment', 'transfer', 'general'))
);

create table if not exists public.stock_movements (
  id text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  item_id text not null,
  item_name text not null,
  movement_type text not null check (movement_type in ('in', 'out', 'adjust', 'sale')),
  qty numeric not null,
  note text not null default '',
  movement_date date not null
);

create table if not exists public.kitchen_orders (
  id text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  table_name text not null,
  items jsonb not null default '[]',
  status text not null check (status in ('new', 'preparing', 'ready', 'served')),
  priority text not null check (priority in ('normal', 'urgent', 'rush')),
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_restaurant_date on public.transactions (restaurant_id, tx_date desc);
create index if not exists idx_ledger_entries_restaurant_date on public.ledger_entries (restaurant_id, entry_date desc);
create index if not exists idx_kitchen_orders_restaurant_status on public.kitchen_orders (restaurant_id, status);

insert into public.restaurants (id, name, location, kot_counter, tx_counter)
values (
  'rest-happus-tadka',
  'Happus Tadka',
  'Mahendinagar-4-Bhashi, Ghuiyaghat',
  1000,
  1
)
on conflict (id) do nothing;

insert into public.staff (id, restaurant_id, name, username, password_hash, role, permissions, active, created_at)
values (
  'admin-default',
  'rest-happus-tadka',
  'Admin',
  'admin',
  'sha256:1b7c28130c4cd4ce18cf41d28fca82a8d98daf7e5b2e8a054a3daab0fa543170',
  'admin',
  array[]::text[],
  true,
  '2020-01-01T00:00:00.000Z'::timestamptz
)
on conflict (id) do nothing;

insert into public.financial_accounts (id, restaurant_id, name, account_type, opening_balance, active)
values
  ('fac-cash', 'rest-happus-tadka', 'Cash in Hand', 'cash', 0, true),
  ('fac-bank', 'rest-happus-tadka', 'Bank Account', 'bank', 0, true),
  ('fac-qr', 'rest-happus-tadka', 'QR / Digital Wallet', 'digital', 0, true)
on conflict (id) do nothing;

insert into public.parties (id, restaurant_id, name, party_type, active)
values ('party-cash-sales', 'rest-happus-tadka', 'Cash sales & expenses', 'other', true)
on conflict (id) do nothing;
