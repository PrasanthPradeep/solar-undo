import { ksebPostForm } from "./kseb.client";

// ---------------------------------------------------------------------------
// Types matching the actual KSEB getDTRAvailable JSON response
// ---------------------------------------------------------------------------

export interface ResRawEntry {
  feeder_name: string;
  id: string;
  transformer_name: string;
  /** DTR rating in kVA, e.g. "160" */
  capacity: string;
  /**
   * 90% × 90% = 81% of DTR capacity in kW, pre-calculated by KSEB.
   * e.g. "129 KW" for a 160 kVA DTR  (Math.floor(0.81 * 160) = 129)
   */
  allowed_cap: string;
  /** Feasibility issued (kW) — approved but not commissioned */
  feasible: string;
  /** Registered / in-progress applications (kW) — counts as used capacity */
  regi: string;
  /** Grid-connected commissioned solar (kW) */
  comp_cap: string;
}

export interface ResDTRAvailableResponse {
  office: {
    office_code: string;
    full_name: string;
    office_phone?: string;
  };
  err_flag: number;
  count: number;
  ason: string;
  list: ResRawEntry[];
}

// ---------------------------------------------------------------------------
// Normalised shape used by the rest of the app
// ---------------------------------------------------------------------------

export interface ResTransformerCapacity {
  /** The real KSEB transformer id */
  ksebTransformerId?: string;
  /** Normalised transformer name (UPPER CASE, spaces normalised) */
  transformerName: string;
  /** Feeder / substation line name */
  feederName: string;
  /** Raw DTR rating in kVA */
  dtrCapacity: number;
  /**
   * Allowed capacity = Math.floor(0.9 * 0.9 * dtrCapacity)
   * = 81% of DTR rating, as calculated by KSEB (matches `allowed_cap` field)
   */
  dtr90Capacity: number;
  /** Feasibility-issued capacity (kW) */
  feasibilityIssued: number;
  /** Registered applications (kW) — counted as used by KSEB formula */
  registrations: number;
  /** Commissioned / grid-connected solar (kW) */
  gridConnected: number;
  /**
   * Remaining solar headroom (kW).
   * Formula (per KSEB recapV2.js):
   *   capAv = Math.floor(0.9 * 0.9 * capacity)
   *   balance = capAv − (feasible + regi) − comp_cap
   */
  balanceAvailable: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function toNumber(value: string): number {
  const parsed = parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeTransformerName(value: string): string {
  return value
    .toUpperCase()
    .replace(/\bT\s*C\b/g, "TC")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Map one raw API entry → normalised capacity record
// Uses the exact formula from KSEB's recapV2.js:
//   capAv    = Math.floor(0.9 * 0.9 * capacity)   ← 81% of kVA rating
//   feasible = parseFloat(feasible) + parseFloat(regi)
//   balance  = capAv − (feasible + comp_cap)
// ---------------------------------------------------------------------------
function mapRawEntry(raw: ResRawEntry): ResTransformerCapacity {
  const dtrCapacity = toNumber(raw.capacity);
  const dtr90Capacity = Math.floor(0.9 * 0.9 * dtrCapacity); // = allowed_cap numeric value
  const feasibilityIssued = toNumber(raw.feasible);
  const registrations = toNumber(raw.regi);
  const gridConnected = toNumber(raw.comp_cap);

  // KSEB formula: balance = capAv − (feasible + regi) − comp_cap, floor to 0
  const balanceAvailable = Math.max(
    0,
    dtr90Capacity - (feasibilityIssued + registrations) - gridConnected
  );

  return {
    ksebTransformerId: raw.id,
    transformerName: normalizeTransformerName(raw.transformer_name),
    feederName: decodeEntities(raw.feeder_name ?? ""),
    dtrCapacity,
    dtr90Capacity,
    feasibilityIssued,
    registrations,
    gridConnected,
    balanceAvailable,
  };
}

// ---------------------------------------------------------------------------
// Parse the full getDTRAvailable JSON response
// ---------------------------------------------------------------------------

export function parseDTRAvailableJson(
  data: ResDTRAvailableResponse
): ResTransformerCapacity[] {
  if (!Array.isArray(data.list)) return [];
  return data.list
    .map(mapRawEntry)
    .filter((row) => row.transformerName.length > 0);
}

// ---------------------------------------------------------------------------
// Transformer matching
// ---------------------------------------------------------------------------

export function findTransformerMatch(
  transformerName: string,
  rows: ResTransformerCapacity[]
): ResTransformerCapacity {
  const normalized = normalizeTransformerName(transformerName);

  // 1. Exact normalised match
  const exact = rows.find(
    (row) => normalizeTransformerName(row.transformerName) === normalized
  );
  if (exact) return exact;

  // 2. TC number match (e.g. "PALLIMUKKU TC 5" ↔ "TC 5")
  const tcNumber = normalized.match(/\bTC\s*(\d+[A-Z0-9/-]*)\b/)?.[1];
  if (tcNumber) {
    const byTc = rows.find(
      (row) =>
        normalizeTransformerName(row.transformerName).match(
          /\bTC\s*(\d+[A-Z0-9/-]*)\b/
        )?.[1] === tcNumber
    );
    if (byTc) return byTc;
  }

  // 3. Prefix match — bill PDF name sometimes has extra words
  const prefixMatch = rows.find(
    (row) =>
      normalizeTransformerName(row.transformerName).startsWith(normalized) ||
      normalized.startsWith(normalizeTransformerName(row.transformerName))
  );
  if (prefixMatch) return prefixMatch;

  throw new Error(
    `Transformer "${transformerName}" was not found in the KSEB RES capacity list for this section. ` +
      `Verify the transformer name on your bill PDF.`
  );
}

// ---------------------------------------------------------------------------
// Main fetch — POST to getDTRAvailable with sectionId (form data)
// The endpoint is an AJAX endpoint called by recapV2.js
// ---------------------------------------------------------------------------

export async function fetchResCapacityByOfficeCode(
  sectionId: string
): Promise<ResTransformerCapacity[]> {
  const res = await ksebPostForm(
    "/selfservices/getDTRAvailable",
    { sectionId },
    {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://wss.kseb.in/selfservices/reCap",
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
    }
  );

  let data: ResDTRAvailableResponse;
  try {
    data = (await res.json()) as ResDTRAvailableResponse;
  } catch {
    throw new Error(
      `KSEB RES returned a non-JSON response for section ${sectionId}. ` +
        `The portal may be temporarily unavailable.`
    );
  }

  if (data.err_flag !== 0) {
    throw new Error(
      `KSEB RES returned an error (err_flag=${data.err_flag}) for section ${sectionId}.`
    );
  }

  if (!Array.isArray(data.list) || data.list.length === 0) {
    throw new Error(
      `KSEB RES returned no transformer data for section ${sectionId}. ` +
        `The section may not have any registered transformers yet.`
    );
  }

  const rows = parseDTRAvailableJson(data);

  if (rows.length === 0) {
    throw new Error(
      `KSEB RES capacity list for section ${sectionId} could not be parsed.`
    );
  }

  return rows;
}
