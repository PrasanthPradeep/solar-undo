export interface CapacityResponse {
  transformerName: string;
  totalCapacity: number;
  availableSolarCapacity: number;
  officeCode: string;
  status: "AVAILABLE" | "LIMITTED" | "FULL";
}
export type SolarStatus = | "AVAILABLE" | "LIMITTED" | "FULL";

export interface SolarEligibility {
  availableCapacity: number;
  recommendedCapacity: number;
  maxAllowedCapacity: number;
  status: SolarStatus;
}