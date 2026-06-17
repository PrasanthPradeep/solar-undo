import { SolarEligibility, SolarStatus } from "./solar.types";

/**
 * Calculates the remaining solar headroom on a transformer.
 *
 * Formula (per KSEB RES documentation):
 *   Balance Available = Allowed Capacity − Feasibility Issued − Grid Connected
 *
 * @param allowedCapacity  - 90% of DTR capacity in kW (`allowed_cap`)
 * @param feasibilityIssued - Solar approved but not commissioned (`feasible`)
 * @param gridConnected    - Commissioned solar capacity (`comp_cap`)
 */
export function calculateBalanceAvailable(
  allowedCapacity: number,
  feasibilityIssued: number,
  gridConnected: number
): number {
  return Math.max(0, allowedCapacity - feasibilityIssued - gridConnected);
}

/**
 * Derives the solar availability status from the remaining balance.
 *
 * Thresholds:
 *  > 10 kW  → AVAILABLE
 *  > 0 kW   → LIMITED
 *  = 0 kW   → FULL
 */
export function deriveSolarStatus(balanceAvailable: number): SolarStatus {
  if (balanceAvailable > 10) return "AVAILABLE";
  if (balanceAvailable > 0) return "LIMITED";
  return "FULL";
}

/**
 * Computes the full solar eligibility record for a transformer balance.
 * Used by the solar availability pipeline (Stage 7).
 */
export function calculateSolarEligibility(
  availableCapacity: number
): SolarEligibility {
  const status = deriveSolarStatus(availableCapacity);

  const recommendedCapacity =
    availableCapacity >= 10 ? 10 : Math.floor(availableCapacity);

  return {
    availableCapacity,
    recommendedCapacity,
    maxAllowedCapacity: availableCapacity,
    status,
  };
}