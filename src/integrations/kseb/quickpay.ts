import { ksebPostFormText } from "./kseb.client";

export interface QuickPayVerificationPayload {
  consumerNumber: string;
  phone: string;
  captchaUniqueIdHidden: string;
  code: string;
  jsessionId?: string;
}

export interface QuickPayConsumerMetadata {
  consumerName: string;
  consumerNumber: string;
  sectionName: string;
  billNo: string;
  tariff: string;
  billAmount?: number;
  dueAmount?: number;
}

const LABELS: Record<keyof QuickPayConsumerMetadata, string[]> = {
  consumerName: ["Consumer Name", "Name"],
  consumerNumber: ["Consumer Number", "Consumer No"],
  sectionName: ["Section Name", "Section"],
  billNo: ["Bill Number", "Bill No"],
  tariff: ["Tariff"],
  billAmount: ["Bill Amount"],
  dueAmount: ["Due Amount"],
};

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(td|th|tr|p|div|li|label)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .trim()
  );
}

/**
 * Safely reads a labelled value from converted HTML text.
 *
 * Handles two layouts:
 *   A) Same-line:  "Label : Value"
 *   B) Next-line:  "Label\nValue"
 *
 * IMPORTANT: `\s` in JS regex matches `\n`, so the previous `\s*` was
 * accidentally crossing line boundaries and picking up the next label
 * (e.g. "Tariff Code:") as the section value.
 * We use `[^\S\n]*` (whitespace except newline) to stay on the same line.
 */
function readLabel(text: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Pattern A: "Label : Value" — separator and value on the SAME line
    // [^\S\n]* = spaces/tabs only (no newline crossing)
    const sameLine = text.match(
      new RegExp(`${escaped}[^\\S\\n]*[:\\-][^\\S\\n]*([^\\n]+)`, "i")
    );
    if (sameLine?.[1]?.trim()) {
      const value = sameLine[1].trim();
      // Reject if value looks like a bare label (e.g. "Tariff Code :")
      if (!isLabelLike(value)) return value;
    }

    // Pattern B: "Label\nValue" — value on the NEXT line
    const nextLine = text.match(
      new RegExp(`${escaped}[^\\S\\n]*\\n[^\\S\\n]*([^\\n]+)`, "i")
    );
    if (nextLine?.[1]?.trim()) {
      const value = nextLine[1].trim();
      if (!isLabelLike(value)) return value;
    }
  }
  return undefined;
}

/**
 * Returns true if the string looks like a field label rather than a value.
 * Labels typically end with ":" or match known KSEB label patterns.
 */
function isLabelLike(value: string): boolean {
  return (
    value.endsWith(":") ||
    value.endsWith(" -") ||
    /^(Consumer|Section|Tariff|Bill|Amount|Name|Number|Due|Mobile|Address|Code)\b.{0,20}:?\s*$/i.test(value)
  );
}

function readAmount(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseQuickPayVerification(html: string): QuickPayConsumerMetadata {
  const text = htmlToText(html);
  const metadata = {
    consumerName: readLabel(text, LABELS.consumerName) ?? "",
    consumerNumber: readLabel(text, LABELS.consumerNumber) ?? "",
    sectionName: readLabel(text, LABELS.sectionName) ?? "",
    billNo: readLabel(text, LABELS.billNo) ?? "",
    tariff: readLabel(text, LABELS.tariff) ?? "",
    billAmount: readAmount(readLabel(text, LABELS.billAmount)),
    dueAmount: readAmount(readLabel(text, LABELS.dueAmount)),
  };

  if (!metadata.consumerNumber) {
    if (/formcondetail|captchaUniqueIdHidden|simpleImg\.image/i.test(html)) {
      throw new Error(
        "KSEB captcha validation failed or the QuickPay session expired. Refresh the captcha and try again."
      );
    }
    throw new Error(
      "KSEB QuickPay verification did not return consumer metadata. Check the consumer number, mobile number, and captcha."
    );
  }

  return metadata;
}

export async function verifyQuickPayConsumer(payload: QuickPayVerificationPayload) {
  const html = await ksebPostFormText(
    "/selfservices/quickPayVerification",
    {
      consumerNumber: payload.consumerNumber,
      phone: payload.phone,
      captchaUniqueIdHidden: payload.captchaUniqueIdHidden,
      code: payload.code,
    },
    payload.jsessionId
      ? {
          headers: {
            Cookie: `JSESSIONID=${payload.jsessionId}`,
            Referer: "https://wss.kseb.in/selfservices/quickpay",
          },
        }
      : undefined
  );

  return parseQuickPayVerification(html);
}
