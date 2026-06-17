import { SolarStatus } from "@/features/solar/solar.types";

export interface Transformer {
  name: string;
  feederName?: string;
  /** DTR rating in kVA */
  dtrCapacity?: number;
  /** 81% of DTR capacity in kW — Math.floor(0.9 * 0.9 * kVA) */
  capacity: number;
  availableSolar: number;
  availableSolarCapacity: number;
  officeCode: string;
  feasibilityIssued?: number;
  /** In-progress registered applications (kW) — counted toward used capacity */
  registrations?: number;
  gridConnected?: number;
  solarAvailable?: boolean;
  status?: SolarStatus;
}


