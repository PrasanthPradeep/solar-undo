/** KSEB-defined solar capacity limits (in kWp). */
export const SOLAR_LIMITS = {
  /** Minimum installable solar capacity for LT consumers. */
  MIN_KWP: 1,
  /** Maximum capacity per consumer under net metering policy. */
  MAX_KWP: 500,
  /** Minimum transformer headroom required to approve a connection. */
  MIN_TRANSFORMER_HEADROOM_KW: 1,
} as const;

/** Input field length constraints. */
export const INPUT_LIMITS = {
  CONSUMER_NUMBER_LENGTH: 13,
  MOBILE_NUMBER_LENGTH: 10,
} as const;
