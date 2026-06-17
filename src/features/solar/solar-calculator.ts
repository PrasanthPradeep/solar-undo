// import { CapacityResponse } from "@/features/solar/solar.types";

// /**
//  * Computes whether a consumer is eligible for rooftop solar installation
//  * based on the available capacity on their linked transformer/DTR.
//  *
//  * KSEB policy: a consumer can install solar up to their sanctioned load,
//  * but the transformer must have sufficient un-allocated solar headroom.
//  */
// export function isEligibleForSolar(
//   sanctionedLoadKw: number,
//   capacity: CapacityResponse
// ): boolean {
//   return capacity.availableSolarCapacity >= sanctionedLoadKw;
// }

// /**
//  * Returns the maximum solar panel capacity (in kWp) a consumer can install.
//  * Capped at the available transformer headroom.
//  */
// export function calculateMaxSolarKwp(
//   sanctionedLoadKw: number,
//   capacity: CapacityResponse
// ): number {
//   return Math.min(sanctionedLoadKw, capacity.availableSolarCapacity);
// }


import { SolarEligibility } from "./solar.types";

export function calculateSolarEligibility(
  availableCapacity: number
): SolarEligibility {
  let status:
    | "AVAILABLE"
    | "LIMITED"
    | "FULL";

  if (availableCapacity > 10) {
    status = "AVAILABLE";
  } else if (availableCapacity > 0) {
    status = "LIMITED";
  } else {
    status = "FULL";
  }

  const recommendedCapacity =
    availableCapacity >= 10
      ? 10
      : Math.floor(availableCapacity);

  return {
    availableCapacity,

    recommendedCapacity,

    maxAllowedCapacity:
      availableCapacity,

    status,
  };
}