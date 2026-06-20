create extension if not exists pgcrypto;

create table if not exists public.transformers (
  id uuid primary key default gen_random_uuid(),
  kseb_transformer_id text not null,
  transformer_name text not null,
  feeder_name text,
  section_code text not null,
  section_name text,
  capacity numeric not null default 0,
  allowed_cap numeric not null default 0,
  feasible numeric not null default 0,
  regi numeric not null default 0,
  comp_cap numeric not null default 0,
  available_kw numeric not null default 0,
  last_updated timestamptz not null default now(),
  unique (kseb_transformer_id),
  unique (section_code, transformer_name)
);

alter table public.transformers
  add column if not exists kseb_transformer_id text;

alter table public.transformers
  add column if not exists available_kw numeric not null default 0;

update public.transformers
set kseb_transformer_id = section_code || ':' || transformer_name
where kseb_transformer_id is null;

alter table public.transformers
  alter column kseb_transformer_id set not null;

alter table public.transformers
  drop constraint if exists transformers_section_code_key;

create table if not exists public.transformer_history (
  id uuid primary key default gen_random_uuid(),
  transformer_id uuid not null references public.transformers(id) on delete cascade,
  available_kw numeric not null default 0,
  capacity numeric not null default 0,
  allowed_cap numeric not null default 0,
  feasible numeric not null default 0,
  regi numeric not null default 0,
  comp_cap numeric not null default 0,
  recorded_date date not null default current_date,
  recorded_at timestamptz not null default now()
);

alter table public.transformer_history
  add column if not exists capacity numeric not null default 0;

alter table public.transformer_history
  add column if not exists allowed_cap numeric not null default 0;

alter table public.transformer_history
  add column if not exists feasible numeric not null default 0;

alter table public.transformer_history
  add column if not exists regi numeric not null default 0;

alter table public.transformer_history
  add column if not exists comp_cap numeric not null default 0;

create table if not exists public.search_logs (
  id uuid primary key default gen_random_uuid(),
  consumer_no text not null,
  transformer_id uuid references public.transformers(id) on delete set null,
  searched_at timestamptz not null default now()
);

create index if not exists search_logs_consumer_idx
  on public.search_logs (consumer_no);

create index if not exists search_logs_searched_at_idx
  on public.search_logs (searched_at desc);

create table if not exists public.consumer_transformers (
  consumer_no text primary key,
  transformer_name text not null,
  transformer_id uuid references public.transformers(id) on delete set null,
  feeder_name text,
  section_code text not null,
  consumer_name text,
  section_name text,
  tariff text,
  bill_no text,
  mobile text,
  office_phone text,
  updated_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

alter table public.consumer_transformers
  add column if not exists consumer_name text;

alter table public.consumer_transformers
  add column if not exists section_name text;

alter table public.consumer_transformers
  add column if not exists tariff text;

alter table public.consumer_transformers
  add column if not exists bill_no text;

alter table public.consumer_transformers
  add column if not exists mobile text;

alter table public.consumer_transformers
  add column if not exists office_phone text;

alter table public.consumer_transformers
  add column if not exists feeder_name text;

alter table public.consumer_transformers
  add column if not exists last_seen timestamptz not null default now();

create index if not exists transformers_section_idx
  on public.transformers (section_code);

create index if not exists transformer_history_lookup_idx
  on public.transformer_history (transformer_id, recorded_at desc);

create index if not exists consumer_transformers_transformer_idx
  on public.consumer_transformers (transformer_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transformers_kseb_transformer_id_key'
  ) then
    alter table public.transformers
      add constraint transformers_kseb_transformer_id_key
      unique (kseb_transformer_id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'transformers_section_code_transformer_name_key'
  ) then
    alter table public.transformers
      add constraint transformers_section_code_transformer_name_key
      unique (section_code, transformer_name);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_numeric_kseb_transformer_id'
  ) then
    update public.transformers
    set kseb_transformer_id = '456638'
    where kseb_transformer_id = '4566:PUTHEN NADA';

    alter table public.transformers
      add constraint chk_numeric_kseb_transformer_id
      check (kseb_transformer_id ~ '^[0-9]+$');
  end if;
end $$;

-- History rows are inserted only when capacity values change (not one per day).
alter table public.transformer_history
  drop constraint if exists transformer_history_recorded_date_key;

alter table public.transformer_history
  drop constraint if exists transformer_history_transformer_id_recorded_date_key;

alter table public.transformers enable row level security;
alter table public.transformer_history enable row level security;
alter table public.consumer_transformers enable row level security;

grant usage on schema public to service_role;

grant select, insert, update, delete on public.transformers to service_role;
grant select, insert, update, delete on public.transformer_history to service_role;
grant select, insert, update, delete on public.consumer_transformers to service_role;
grant select, insert, update, delete on public.search_logs to service_role;

alter table public.search_logs enable row level security;

notify pgrst, 'reload schema';
