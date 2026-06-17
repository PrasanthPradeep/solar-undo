import pdf from "pdf-parse/lib/pdf-parse.js";

import { KSEB_OLD_BASE_URL, ksebGetText, ksebPostFormBinary } from "./kseb.client";

export interface BillPdfPayload {
  consumerNumber: string;
  phone: string;
  captchaUniqueIdHidden?: string;
  code?: string;
}

export interface TransformerIdentity {
  transformerName: string;
  tcNumber?: string;
}

export interface BillPdfMetadata {
  consumerName: string;
  consumerNumber: string;
  sectionName: string;
  billNo: string;
  tariff: string;
}

export interface BillPdfData {
  metadata: BillPdfMetadata;
  transformer: TransformerIdentity;
}

function normalizeTransformerName(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\bT\s*C\b/gi, "TC")
    .trim()
    .toUpperCase();
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function extractOkey(html: string) {
  const match = html.match(/name=["']okey["'][^>]*value=["']([^"']+)/i);
  if (!match?.[1]) {
    throw new Error("KSEB BillView did not return the bill form token.");
  }
  return decodeEntities(match[1]);
}

function assertPdfResponse(buffer: Buffer, contentType: string) {
  if (buffer.subarray(0, 5).toString("ascii") === "%PDF-") return;

  const preview = buffer.toString("utf8", 0, Math.min(buffer.length, 500));
  const message = /<html|<!doctype/i.test(preview)
    ? `KSEB BillView returned HTML instead of a PDF: ${htmlToText(preview).slice(0, 220)}`
    : `KSEB BillView returned ${contentType || "an unknown content type"} instead of a PDF.`;

  throw new Error(message);
}

export function extractTransformerFromBillText(text: string): TransformerIdentity {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const dtrInline = line.match(/\bDTR\s*[:\-]?\s*([A-Z0-9][A-Z0-9 ._/()-]{2,})$/i);
    const candidate = dtrInline?.[1] || (/\bDTR\b/i.test(line) ? lines[index + 1] : "");

    if (candidate && !/^(billing|tariff|bill|date|phone|consumer)\b/i.test(candidate)) {
      const transformerName = normalizeTransformerName(candidate);
      const tcNumber = transformerName.match(/\bTC[\s-]*(\d+[A-Z0-9/-]*)\b/i)?.[1];
      return { transformerName, tcNumber };
    }
  }

  const patterns = [
    /(?:Transformer|DTR|TC)\s*(?:Name|No|Number)?\s*[:\-]\s*([A-Z0-9][A-Z0-9 ._/()-]*(?:TC|T C)[\s-]*\d+[A-Z0-9/-]*)/i,
    /([A-Z][A-Z0-9 ._/()-]{2,}\s+(?:TC|T C)[\s-]*\d+[A-Z0-9/-]*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const transformerName = normalizeTransformerName(match[1]);
      const tcNumber = transformerName.match(/\bTC[\s-]*(\d+[A-Z0-9/-]*)\b/i)?.[1];
      return { transformerName, tcNumber };
    }
  }

  throw new Error("Could not extract transformer name from the bill PDF.");
}

function readMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].replace(/\s+/g, " ").trim();
  }
  return "";
}

export function extractBillMetadataFromText(text: string): BillPdfMetadata {
  // Try to extract section name from multiple bill formats:
  //   Format A: "Section [KPLL01] - Electrical Section Pallimukku"
  //   Format B: "Electrical Section Pallimukku" (standalone)
  //   Format C: "Section : Pallimukku" or "Section Name : Pallimukku"
  const sectionRaw = readMatch(text, [
    /Section\s*\n?\s*\[[^\]]+\]\s*-\s*(Electrical Section\s+[^\n]+)/i,
    /\[[^\]]+\]\s*-\s*(Electrical Section\s+[^\n]+)/i,
    /Electrical\s+Section\s+([A-Z][A-Za-z\s]+?)(?:\n|$|\d)/i,
    /Section\s*(?:Name)?\s*[:\-]\s*([A-Za-z][A-Za-z\s]{2,}?)(?:\n|$)/i,
  ]);
  const sectionName = sectionRaw
    .replace(/^Electrical\s+Section\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const metadata = {
    consumerName: readMatch(text, [/Name\s*&\s*Mailing Address\s*\n\s*([^\n]+)/i]),
    consumerNumber: readMatch(text, [/Consumer#\s*\n?\s*(\d{13})/i]),
    sectionName,
    billNo: readMatch(text, [/Bill#\s*\n?\s*(\d+)/i]),
    tariff: readMatch(text, [/Tariff\/Phase\s*([A-Z0-9-]+)/i]),
  };

  // Consumer number and bill number are hard requirements from the PDF.
  // Section name is validated downstream in solar-availability.ts.
  if (!metadata.consumerNumber || !metadata.billNo) {
    throw new Error("Could not extract consumer metadata from the KSEB bill PDF.");
  }

  return metadata;
}


export async function fetchBillPdf(payload: BillPdfPayload) {
  const formHtml = await ksebGetText("/billview/index.php", { baseUrl: KSEB_OLD_BASE_URL });
  const okey = extractOkey(formHtml);
  const response = await ksebPostFormBinary(
    "/billview/index.php",
    {
      consumerno: payload.consumerNumber,
      regmobno: payload.phone,
      okey,
      b_submit_0: "View Bill",
    },
    { baseUrl: KSEB_OLD_BASE_URL }
  );

  assertPdfResponse(response.buffer, response.contentType);
  return response.buffer;
}

export async function extractTransformerFromBillPdf(buffer: Buffer) {
  const parsed = await pdf(buffer);
  return extractTransformerFromBillText(parsed.text);
}

export async function extractBillDataFromPdf(buffer: Buffer): Promise<BillPdfData> {
  const parsed = await pdf(buffer);
  return {
    metadata: extractBillMetadataFromText(parsed.text),
    transformer: extractTransformerFromBillText(parsed.text),
  };
}
