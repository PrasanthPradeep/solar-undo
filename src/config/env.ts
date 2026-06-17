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
} as const;
