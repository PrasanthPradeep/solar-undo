/** Internal Next.js API route paths. */
export const API_ROUTES = {
  CONSUMER: "/api/consumer",
  VERIFY: "/api/verify",
  SOLAR_CAPACITY: "/api/solar-capacity",
} as const;

/** Client-side page routes. */
export const PAGE_ROUTES = {
  HOME: "/",
  VERIFY: "/verify",
  RESULT: "/result",
} as const;
