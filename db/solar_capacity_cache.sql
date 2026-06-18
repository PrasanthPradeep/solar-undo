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
  recorded_date date not null default current_date,
  recorded_at timestamptz not null default now(),
  unique (transformer_id, recorded_date)
);

create table if not exists public.consumer_transformers (
  consumer_no text primary key,
  transformer_name text not null,
  transformer_id uuid references public.transformers(id) on delete set null,
  section_code text not null,
  consumer_name text,
  section_name text,
  tariff text,
  bill_no text,
  mobile text,
  office_phone text,
  updated_at timestamptz not null default now()
);

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
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transformer_history_transformer_id_recorded_date_key'
  ) then
    alter table public.transformer_history
      add constraint transformer_history_transformer_id_recorded_date_key
      unique (transformer_id, recorded_date);
  end if;
end $$;

alter table public.transformers enable row level security;
alter table public.transformer_history enable row level security;
alter table public.consumer_transformers enable row level security;

grant usage on schema public to service_role;

grant select, insert, update, delete on public.transformers to service_role;
grant select, insert, update, delete on public.transformer_history to service_role;
grant select, insert, update, delete on public.consumer_transformers to service_role;
