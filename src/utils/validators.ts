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

/**
 * Validates that a KSEB transformer ID consists only of digits.
 */
export function validateKsebId(id: string): string {
  const value = id.trim();

  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid KSEB ID: ${id}`);
  }

  return value;
}
