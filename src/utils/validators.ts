/**
 * Validates a 13-digit KSEB consumer number.
 */
export function isValidConsumerNumber(value: string): boolean {
  return /^\d{13}$/.test(value);
}

/**
 * Validates a 10-digit Indian mobile number.
 */
export function isValidMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value);
}
