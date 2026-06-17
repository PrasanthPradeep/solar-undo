import { extractBillDataFromPdf, fetchBillPdf } from "./billview";
import { lookupOfficeBySectionAsync } from "./office-map";
import { fetchResCapacityByOfficeCode, findTransformerMatch } from "./res-capacity";
import { QuickPayVerificationPayload, verifyQuickPayConsumer } from "./quickpay";
import { calculateSolarEligibility } from "@/features/solar/solar-calculator";

export type SolarAvailabilityRequest = QuickPayVerificationPayload;

export interface SolarAvailabilityResponse {
  consumerName: string;
  consumerNumber: string;
  sectionName: string;
  billNo: string;
  tariff: string;
  /** Matched and normalised transformer name from the RES dataset */
  transformerName: string;
  /** Feeder / substation line serving this transformer */
  feederName: string;
  /** KSEB section ID used to query getDTRAvailable */
  officeCode: string;
  /** Raw DTR rating in kVA */
  dtrCapacity: number;
  /** 81% of DTR capacity in kW — Math.floor(0.9 * 0.9 * kVA) */
  dtr90Capacity: number;
  /** Solar capacity approved but not yet commissioned (kW) */
  feasibilityIssued: number;
  /** Registered in-progress applications (kW) — counted as used capacity */
  registrations: number;
  /** Commissioned / grid-connected solar capacity (kW) */
  gridConnected: number;
  /** Remaining solar headroom (kW) */
  balanceAvailable: number;
  solarAvailable: boolean;
  /** AVAILABLE (>10 kW headroom) | LIMITED (>0 kW) | FULL (0 kW) */
  status: "AVAILABLE" | "LIMITED" | "FULL";
}

export class SolarAvailabilityStageError extends Error {
  constructor(
    public readonly stage:
      | "quickpay"
      | "billview"
      | "office"
      | "res-capacity"
      | "transformer-match",
    message: string
  ) {
    super(message);
    this.name = "SolarAvailabilityStageError";
  }
}

export async function getSolarAvailability(
  payload: SolarAvailabilityRequest
): Promise<SolarAvailabilityResponse> {
  // -------------------------------------------------------------------------
  // Stage 1 + 2 — Run QuickPay and Bill PDF in parallel for speed
  // -------------------------------------------------------------------------
  const [quickPayResult, billResult] = await Promise.allSettled([
    verifyQuickPayConsumer(payload),
    fetchBillPdf(payload).then((buf) => extractBillDataFromPdf(buf)),
  ]);

  // Bill PDF is mandatory (provides transformer name)
  if (billResult.status === "rejected") {
    const msg =
      billResult.reason instanceof Error
        ? billResult.reason.message
        : "Bill PDF retrieval or parsing failed.";
    throw new SolarAvailabilityStageError("billview", msg);
  }
  const billData = billResult.value;

  // QuickPay is optional — it supplements consumer metadata and section name
  const quickPayConsumer =
    quickPayResult.status === "fulfilled" ? quickPayResult.value : null;

  // -------------------------------------------------------------------------
  // Section name resolution strategy (most reliable → least reliable):
  //
  //   1. Bill PDF — section is embedded in the standardised PDF format
  //      (e.g. "[KPLL01] - Electrical Section Pallimukku")
  //   2. QuickPay — HTML-parsed, more fragile; only used when non-empty
  //      and does not look like a label (e.g. "Tariff Code:")
  // -------------------------------------------------------------------------
  const sectionName =
    billData.metadata.sectionName ||
    (quickPayConsumer?.sectionName && !quickPayConsumer.sectionName.endsWith(":")
      ? quickPayConsumer.sectionName
      : "");

  if (!sectionName) {
    throw new SolarAvailabilityStageError(
      "office",
      "Could not determine electrical section from the bill PDF or QuickPay. " +
        "The bill format may not be supported yet."
    );
  }

  // -------------------------------------------------------------------------
  // Stage 3 — Section → office code (dynamic lookup, falls back to seed list)
  // -------------------------------------------------------------------------
  const office = await lookupOfficeBySectionAsync(sectionName).catch((error: unknown) => {
    throw new SolarAvailabilityStageError(
      "office",
      error instanceof Error ? error.message : "Office lookup failed."
    );
  });

  // -------------------------------------------------------------------------
  // Stage 4 — RES getDTRAvailable (POST with sectionId form data)
  // -------------------------------------------------------------------------
  const capacities = await fetchResCapacityByOfficeCode(office.officeCode).catch(
    (error: unknown) => {
      throw new SolarAvailabilityStageError(
        "res-capacity",
        error instanceof Error ? error.message : "RES capacity lookup failed."
      );
    }
  );

  // -------------------------------------------------------------------------
  // Stage 5 — Match transformer name from bill PDF against RES dataset
  // -------------------------------------------------------------------------
  const transformer = billData.transformer;
  const matchedCapacity = (() => {
    try {
      return findTransformerMatch(transformer.transformerName, capacities);
    } catch (error) {
      throw new SolarAvailabilityStageError(
        "transformer-match",
        error instanceof Error ? error.message : "Transformer match failed."
      );
    }
  })();

  // -------------------------------------------------------------------------
  // Stage 6 & 7 — Calculate balance and classify availability
  // -------------------------------------------------------------------------
  const { status } = calculateSolarEligibility(matchedCapacity.balanceAvailable);

  // Merge consumer metadata: QuickPay (masked name, etc.) takes priority
  // over bill PDF for display fields, but section comes from bill PDF
  const consumerName =
    quickPayConsumer?.consumerName || billData.metadata.consumerName;
  const consumerNumber =
    quickPayConsumer?.consumerNumber ||
    billData.metadata.consumerNumber ||
    payload.consumerNumber;
  const billNo = quickPayConsumer?.billNo || billData.metadata.billNo;
  const tariff = quickPayConsumer?.tariff || billData.metadata.tariff;

  return {
    consumerName,
    consumerNumber,
    sectionName,
    billNo,
    tariff,
    transformerName: matchedCapacity.transformerName,
    feederName: matchedCapacity.feederName,
    officeCode: office.officeCode,
    dtrCapacity: matchedCapacity.dtrCapacity,
    dtr90Capacity: matchedCapacity.dtr90Capacity,
    feasibilityIssued: matchedCapacity.feasibilityIssued,
    registrations: matchedCapacity.registrations,
    gridConnected: matchedCapacity.gridConnected,
    balanceAvailable: matchedCapacity.balanceAvailable,
    solarAvailable: matchedCapacity.balanceAvailable > 0,
    status,
  };
}
