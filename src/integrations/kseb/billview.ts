import { ksebGet } from "./kseb.client";

export interface BillDetails {
  billNo: string;
  amount: number;
  dueDate: string;
  units: number;
}

/**
 * Fetches the latest bill details for a given consumer number.
 * TODO: Map to the real KSEB BillView endpoint.
 */
export async function getBillDetails(consumerNumber: string): Promise<BillDetails> {
  return ksebGet<BillDetails>(`/billview/${consumerNumber}`);
}
