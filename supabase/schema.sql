-- Enable extensions
create extension if not exists pgcrypto;

-- Accounts (app auth)
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  username text not null unique,
  password text not null,
  role text not null check (role in ('director', 'assistant', 'worker')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  last_activity text not null,
  permissions jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_uz text,
  image_url text,
  category text not null,
  category_uz text,
  quantity integer not null default 0,
  unit text not null,
  price numeric not null default 0,
  supplier text not null,
  expiration_date text not null,
  status text not null,
  notes text,
  shipment_recipient jsonb,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  company text,
  created_by_role text,
  created_by_user_id text,
  total_amount numeric not null,
  paid_amount numeric not null,
  remaining_amount numeric not null,
  issue_date text not null,
  due_date text not null,
  status text not null,
  products jsonb not null default '[]'::jsonb,
  notes text,
  debt_history jsonb not null default '[]'::jsonb,
  payment_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_sales (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  company text,
  product_id text not null,
  product_name text not null,
  quantity integer not null,
  amount_uzs numeric not null,
  date text not null,
  created_by_user_id text,
  created_by_role text,
  created_at timestamptz not null default now()
);

create table if not exists public.worker_kpis (
  user_id text not null,
  full_name text not null,
  operations_count integer not null default 0,
  reception_accuracy numeric not null default 0,
  deadline_compliance numeric not null default 0,
  tasks_on_time integer not null default 0,
  period text not null,
  period_start text not null,
  period_end text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, period, period_start, period_end)
);

create table if not exists public.audit_log (
  id text primary key,
  at text not null,
  user_name text not null,
  user_role text not null,
  action text not null,
  entity text not null,
  details text not null,
  ip text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_reads (
  user_id text not null,
  audit_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, audit_id)
);

-- Simple updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_accounts_updated_at on public.accounts;
create trigger trg_accounts_updated_at before update on public.accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_debts_updated_at on public.debts;
create trigger trg_debts_updated_at before update on public.debts
for each row execute function public.set_updated_at();

drop trigger if exists trg_worker_kpis_updated_at on public.worker_kpis;
create trigger trg_worker_kpis_updated_at before update on public.worker_kpis
for each row execute function public.set_updated_at();

-- RLS and broad authenticated access (role checks are still enforced in app logic)
alter table public.accounts enable row level security;
alter table public.products enable row level security;
alter table public.debts enable row level security;
alter table public.client_sales enable row level security;
alter table public.worker_kpis enable row level security;
alter table public.audit_log enable row level security;
alter table public.audit_reads enable row level security;

drop policy if exists p_accounts_all on public.accounts;
create policy p_accounts_all on public.accounts for all to anon, authenticated using (true) with check (true);

drop policy if exists p_products_all on public.products;
create policy p_products_all on public.products for all to anon, authenticated using (true) with check (true);

drop policy if exists p_debts_all on public.debts;
create policy p_debts_all on public.debts for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sales_all on public.client_sales;
create policy p_sales_all on public.client_sales for all to anon, authenticated using (true) with check (true);

drop policy if exists p_kpi_all on public.worker_kpis;
create policy p_kpi_all on public.worker_kpis for all to anon, authenticated using (true) with check (true);

drop policy if exists p_audit_all on public.audit_log;
create policy p_audit_all on public.audit_log for all to anon, authenticated using (true) with check (true);

drop policy if exists p_audit_reads_all on public.audit_reads;
create policy p_audit_reads_all on public.audit_reads for all to anon, authenticated using (true) with check (true);

-- Seed director account (clean start)
insert into public.accounts (full_name, phone, username, password, role, status, last_activity, permissions)
values ('Karimov Otabek', '+998 90 111 22 33', 'diyor', '1234', 'director', 'active', to_char(now(), 'YYYY-MM-DD HH24:MI'), null)
on conflict (username) do nothing;

-- Realtime publication for cross-device sync
do $$
begin
  begin
    alter publication supabase_realtime add table public.accounts;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.products;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.debts;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.client_sales;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.audit_log;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.audit_reads;
  exception when duplicate_object then null; end;
end$$;
