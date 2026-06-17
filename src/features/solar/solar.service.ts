import { CapacityResponse } from "@/features/solar/solar.types";
import { mockTransformer } from "@/lib/mock";

export const CapacityService = {
  /**
   * Gets the solar hosting capacity for a given transformer/DTR.
   * TODO: Replace mock with real capacity data source.
   */
  async getCapacity(transformerName: string): Promise<CapacityResponse | null> {
    if (transformerName === mockTransformer.name) {
      return {
        transformerName: mockTransformer.name,
        totalCapacity: mockTransformer.capacity,
        availableSolarCapacity: mockTransformer.availableSolar,
        officeCode: mockTransformer.officeCode,
        status: "AVAILABLE",
      };
    }
    return null;
  },
};
