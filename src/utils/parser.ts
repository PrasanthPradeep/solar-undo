/**
 * Parses a raw consumer number string — strips whitespace and normalises
 * to exactly 13 digits.
 */
export function parseConsumerNumber(raw: string): string {
  return raw.trim().replace(/\D/g, "");
}

/**
 * Parses a raw mobile number string — strips whitespace and non-digits.
 */
export function parseMobileNumber(raw: string): string {
  return raw.trim().replace(/\D/g, "");
}

/**
 * Parses a kW numeric value from a string, returning 0 on parse failure.
 */
export function parseKw(raw: string | number): number {
  const n = Number(raw);
  return isNaN(n) ? 0 : n;
}
