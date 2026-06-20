import { SUPPORT_CONFIG } from "@/config/support";

export function generateUpiUrl(amount?: number): string {
  const { upiId, payeeName } = SUPPORT_CONFIG;
  const params = [
    `pa=${encodeURIComponent(upiId)}`,
    `pn=${encodeURIComponent(payeeName)}`
  ];
  if (amount !== undefined && amount > 0) {
    params.push(`am=${amount}`);
  }
  params.push("cu=INR");
  return `upi://pay?${params.join("&")}`;
}
