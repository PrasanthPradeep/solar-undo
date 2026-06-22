-- ============================================================
-- SQL Migration: Mobile Hash & Data Privacy Updates
-- ============================================================

-- 1. Phase 1 Database Change: Add mobile_hash column
alter table public.consumer_transformers
add column if not exists mobile_hash text;

-- 2. Phase 4 Expiry Column: Add expires_at column
alter table public.consumer_transformers
add column if not exists expires_at timestamptz not null default (now() + interval '180 days');

-- 3. Phase 9 Secure Database Access: Configure RLS and access permissions
alter table public.consumer_transformers enable row level security;

-- Revoke all permissions on consumer_transformers from anon and authenticated roles
revoke all on public.consumer_transformers from anon;
revoke all on public.consumer_transformers from authenticated;

-- Explicitly ensure only service_role (used by our server-side API endpoints) has access
grant select, insert, update, delete on public.consumer_transformers to service_role;

-- 4. Phase 3: Post-Data Migration Drop Query
-- NOTE: Execute this ONLY after running the data migration script and verifying counts!
-- alter table public.consumer_transformers
--   drop column if exists mobile,
--   drop column if exists consumer_name,
--   drop column if exists tariff,
--   drop column if exists bill_no,
--   drop column if exists office_phone,
--   drop column if exists feeder_name,
--   drop column if exists transformer_name;
