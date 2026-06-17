/**
 * Formats a kWp value for display, e.g. 12.5 → "12.5 kWp"
 */
export function formatKwp(value: number): string {
  return `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} kWp`;
}

/**
 * Formats a kW value for display, e.g. 100 → "100 kW"
 */
export function formatKw(value: number): string {
  return `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} kW`;
}

/**
 * Masks a mobile number for safe display, e.g. "9847208262" → "98XXXX8262"
 */
export function maskMobile(mobile: string): string {
  if (mobile.length < 6) return mobile;
  return `${mobile.slice(0, 2)}XXXX${mobile.slice(-4)}`;
}

/**
 * Masks a consumer number, showing only the last 4 digits.
 */
export function maskConsumerNumber(num: string): string {
  if (num.length < 4) return num;
  return `${"X".repeat(num.length - 4)}${num.slice(-4)}`;
}
