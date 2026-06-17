import { ksebPost } from "./kseb.client";

export interface QuickPayPayload {
  consumerNumber: string;
  amount: number;
}

export interface QuickPayResult {
  transactionId: string;
  status: "SUCCESS" | "FAILURE" | "PENDING";
}

/**
 * Initiates a QuickPay transaction for a KSEB consumer.
 * TODO: Map to the real KSEB QuickPay endpoint and handle redirect flow.
 */
export async function initiateQuickPay(payload: QuickPayPayload): Promise<QuickPayResult> {
  return ksebPost<QuickPayResult>("/quickpay/initiate", payload);
}
