import { Consumer } from "./consumer.types";

/**
 * Maps raw KSEB API response data to the canonical Consumer domain model.
 * TODO: Implement real field mapping once KSEB API contract is known.
 */
export function mapKsebResponseToConsumer(raw: Record<string, unknown>): Consumer {
  return {
    consumerNumber: String(raw.consumerNumber ?? ""),
    consumerName: String(raw.consumerName ?? ""),
    mobile: String(raw.mobile ?? ""),
    section: String(raw.section ?? ""),
    tariff: String(raw.tariff ?? ""),
    billNo: String(raw.billNo ?? ""),
    dtr: String(raw.dtr ?? ""),
  };
}
