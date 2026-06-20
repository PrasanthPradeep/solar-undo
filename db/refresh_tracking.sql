create table if not exists public.refresh_runs (
  id uuid primary key default gen_random_uuid(),

  started_at timestamptz not null default now(),
  completed_at timestamptz,

  status text not null default 'RUNNING' check (status in ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT')),
  run_type text not null default 'REFRESH' check (run_type in ('REFRESH', 'DISCOVERY')),
  triggered_by text not null default 'api',
  failure_reason text,

  total_sections integer not null default 0,
  processed_sections integer not null default 0,

  total_transformers integer not null default 0,

  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,

  failures_count integer not null default 0,

  current_offset integer not null default 0,

  metadata jsonb
);

create table if not exists public.refresh_changes (
  id bigserial primary key,

  run_id uuid references public.refresh_runs(id) on delete cascade,

  district_id integer,
  section_code text,
  transformer_id text,
  transformer_uuid uuid references public.transformers(id) on delete set null,

  field_name text not null,

  old_value text,
  new_value text,

  section_name text,
  district_name text,
  transformer_name text,

  changed_at timestamptz not null default now()
);

create table if not exists public.district_refresh_progress (
  run_id uuid references public.refresh_runs(id) on delete cascade,

  district_id integer not null,

  district_name text not null,

  total_sections integer not null default 0,

  processed_sections integer not null default 0,

  transformers integer not null default 0,

  updated integer not null default 0,

  status text not null default 'PENDING' check (status in ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT')),

  started_at timestamptz,

  completed_at timestamptz,
  
  primary key (run_id, district_id)
);

-- Enable RLS
alter table public.refresh_runs enable row level security;
alter table public.refresh_changes enable row level security;
alter table public.district_refresh_progress enable row level security;

-- Setup standard RLS policies
create policy "Allow public read access to refresh_runs"
  on public.refresh_runs for select
  using (true);

create policy "Allow public read access to district_refresh_progress"
  on public.district_refresh_progress for select
  using (true);

create policy "Allow public read access to refresh_changes"
  on public.refresh_changes for select
  using (true);

-- Grant privileges to service_role
grant select, insert, update, delete on public.refresh_runs to service_role;
grant select, insert, update, delete on public.refresh_changes to service_role;
grant select, insert, update, delete on public.district_refresh_progress to service_role;

-- Performance Indexes
create index if not exists idx_refresh_runs_started on public.refresh_runs(started_at desc);

create index if not exists idx_district_progress_run on public.district_refresh_progress(run_id);
create index if not exists idx_district_progress_status on public.district_refresh_progress(status);

create index if not exists idx_refresh_changes_run on public.refresh_changes(run_id);
create index if not exists idx_refresh_changes_transformer on public.refresh_changes(transformer_id);
create index if not exists idx_refresh_changes_changed_at on public.refresh_changes(changed_at desc);

create index if not exists idx_refresh_changes_district on public.refresh_changes(district_id);
create index if not exists idx_refresh_changes_section on public.refresh_changes(section_code);

-- Stored procedure to atomically update progress
create or replace function public.increment_refresh_progress(
  p_run_id uuid,
  p_district_id integer,
  p_transformers integer,
  p_inserted integer,
  p_updated integer,
  p_skipped integer,
  p_failures integer,
  p_offset integer
) returns void as $$
begin
  -- 1. Update the main refresh run (Counters only, no completion or status change!)
  update public.refresh_runs
  set 
    processed_sections = processed_sections + 1,
    total_transformers = total_transformers + p_transformers,
    inserted_count = inserted_count + p_inserted,
    updated_count = updated_count + p_updated,
    skipped_count = skipped_count + p_skipped,
    failures_count = failures_count + p_failures,
    current_offset = p_offset
  where id = p_run_id;

  -- 2. Update the district progress (District completing is valid here)
  update public.district_refresh_progress
  set
    processed_sections = processed_sections + 1,
    transformers = transformers + p_transformers,
    updated = updated + p_updated,
    started_at = coalesce(started_at, now()),
    status = case 
      when processed_sections + 1 >= total_sections then 'COMPLETED'
      else 'RUNNING'
    end,
    completed_at = case 
      when processed_sections + 1 >= total_sections then now()
      else null
    end
  where run_id = p_run_id and district_id = p_district_id;
end;
$$ language plpgsql security definer;

grant execute on function public.increment_refresh_progress to service_role;

-- Stored procedure to finalize a refresh run
create or replace function public.complete_refresh_run(
  p_run_id uuid,
  p_status text,
  p_failure_reason text default null
) returns void as $$
begin
  update public.refresh_runs
  set 
    status = p_status,
    failure_reason = p_failure_reason,
    completed_at = coalesce(completed_at, now())
  where id = p_run_id;

  -- For any district progress not completed, set its status to p_status (e.g. FAILED)
  if p_status = 'FAILED' then
    update public.district_refresh_progress
    set 
      status = 'FAILED',
      completed_at = coalesce(completed_at, now())
    where run_id = p_run_id and status in ('PENDING', 'RUNNING');
  end if;
end;
$$ language plpgsql security definer;

grant execute on function public.complete_refresh_run to service_role;

-- Summary View for Dashboard Querying
create or replace view public.latest_refresh_summary as
select
  r.id,
  r.started_at,
  r.completed_at,
  r.status,
  r.run_type,
  r.triggered_by,
  r.failure_reason,
  r.total_sections,
  r.processed_sections,
  r.total_transformers,
  r.inserted_count,
  r.updated_count,
  r.skipped_count,
  r.failures_count,
  coalesce(count(c.id), 0) as changes_count
from public.refresh_runs r
left join public.refresh_changes c
  on c.run_id = r.id
group by 
  r.id,
  r.started_at,
  r.completed_at,
  r.status,
  r.run_type,
  r.triggered_by,
  r.failure_reason,
  r.total_sections,
  r.processed_sections,
  r.total_transformers,
  r.inserted_count,
  r.updated_count,
  r.skipped_count,
  r.failures_count;

grant select on public.latest_refresh_summary to service_role;
