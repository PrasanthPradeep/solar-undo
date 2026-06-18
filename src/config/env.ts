/**
 * Environment configuration with safe defaults and type-checked access.
 * Add all process.env reads here — never access process.env directly in app code.
 */
export const env = {
  /** Base URL of the KSEB portal for integration calls. */
  KSEB_BASE_URL: process.env.KSEB_BASE_URL ?? "https://wss.kseb.in",

  /** Current deployment environment. */
  NODE_ENV: process.env.NODE_ENV ?? "development",

  /** Whether to use mock data instead of live KSEB API. */
  USE_MOCK: process.env.USE_MOCK === "true" || process.env.NODE_ENV === "development",

  /** Supabase project REST endpoint, e.g. https://xxx.supabase.co. */
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",

  /** Server-only Supabase service role key for cache reads/writes. */
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  /** Bearer token Vercel Cron sends to /api/cron/update-transformers. */
  CRON_SECRET: process.env.CRON_SECRET ?? "",

  /** Optional bearer token for manual/scheduler calls to /api/capacity-sync. */
  CAPACITY_SYNC_SECRET: process.env.CAPACITY_SYNC_SECRET ?? "",
} as const;
