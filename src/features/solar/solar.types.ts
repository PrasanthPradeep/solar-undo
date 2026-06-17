export type SolarStatus = "AVAILABLE" | "LIMITED" | "FULL";

export interface SolarEligibility {
  availableCapacity: number;
  recommendedCapacity: number;
  maxAllowedCapacity: number;
  status: SolarStatus;
}

/**
 * @deprecated Use SolarEligibility. Kept for store backward-compat.
 */
export interface CapacityResponse {
  transformerName: string;
  totalCapacity: number;
  availableSolarCapacity: number;
  officeCode: string;
  status: SolarStatus;
}
