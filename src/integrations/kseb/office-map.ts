import { ksebPostForm } from "./kseb.client";

export interface KsebOffice {
  officeCode: string;
  fullName: string;
  sectionName: string;
  districtId: number;
}

// ---------------------------------------------------------------------------
// Kerala district IDs (from GET /selfservices/getDistricts)
// Hardcoded to avoid the extra round-trip — very stable data
// ---------------------------------------------------------------------------
const KERALA_DISTRICT_IDS: Record<string, number> = {
  THIRUVANANTHAPURAM: 1,
  KOLLAM: 2,
  PATHANAMTHITTA: 3,
  ALAPUZHA: 4,
  KOTTAYAM: 5,
  IDUKKI: 6,
  ERNAKULAM: 7,
  THRISSUR: 8,
  PALAKKAD: 9,
  MALAPPURAM: 10,
  KOZHIKODE: 11,
  WAYANAD: 12,
  KANNUR: 13,
  KASARGODE: 14,
};

export const DISTRICT_ID_TO_NAME: Record<number, string> = {
  1: "Thiruvananthapuram",
  2: "Kollam",
  3: "Pathanamthitta",
  4: "Alappuzha",
  5: "Kottayam",
  6: "Idukki",
  7: "Ernakulam",
  8: "Thrissur",
  9: "Palakkad",
  10: "Malappuram",
  11: "Kozhikode",
  12: "Wayanad",
  13: "Kannur",
  14: "Kasaragod",
};

// ---------------------------------------------------------------------------
// Module-level cache — populated on first lookup
// ---------------------------------------------------------------------------
let _cachedOffices: KsebOffice[] | null = null;
let _fetchPromise: Promise<KsebOffice[]> | null = null;

// ---------------------------------------------------------------------------
// Parse the getinputSection response
// Response format: {"Section Name [5617]": 5617, "Section Name-2 [5618]": 5618, ...}
// ---------------------------------------------------------------------------
function parseSectionResponse(json: Record<string, number>, districtId: number): KsebOffice[] {
  return Object.entries(json).map(([displayName, id]) => {
    // Strip the trailing " [id]" from display name
    const cleanName = displayName.replace(/\s*\[\d+\]\s*$/, "").trim();
    return {
      officeCode: String(id),
      fullName: cleanName,
      sectionName: cleanName
        .replace(/\bElectrical\s+Section\b/gi, "")
        .replace(/\s+/g, " ")
        .trim(),
      districtId,
    };
  });
}

// ---------------------------------------------------------------------------
// Fetch all sections across all Kerala districts (parallelised)
// ---------------------------------------------------------------------------
async function fetchAllSections(): Promise<KsebOffice[]> {
  const results = await Promise.allSettled(
    Object.entries(KERALA_DISTRICT_IDS).map(async ([, districtId]) => {
      const res = await ksebPostForm(
        "/selfservices/getinputSection",
        { distictid: String(districtId) },
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Referer: "https://wss.kseb.in/selfservices/reCap",
          },
        }
      );
      const json = (await res.json()) as Record<string, number>;
      return parseSectionResponse(json, districtId);
    })
  );

  const offices: KsebOffice[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") offices.push(...result.value);
  }
  return offices;
}

// ---------------------------------------------------------------------------
// Public: get (or build) the full section list with caching
// ---------------------------------------------------------------------------
export async function getOfficeList(): Promise<KsebOffice[]> {
  if (_cachedOffices) return _cachedOffices;

  // Prevent thundering herd — only one fetch at a time
  if (!_fetchPromise) {
    _fetchPromise = fetchAllSections()
      .then((offices) => {
        _cachedOffices = offices;
        return offices;
      })
      .catch(() => {
        _fetchPromise = null;
        return [] as KsebOffice[];
      });
  }

  return _fetchPromise;
}

// ---------------------------------------------------------------------------
// Public: get sections for a single district (no full-list cache needed)
// ---------------------------------------------------------------------------
export async function getOfficesByDistrict(districtId: number): Promise<KsebOffice[]> {
  const res = await ksebPostForm(
    "/selfservices/getinputSection",
    { distictid: String(districtId) },
    {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://wss.kseb.in/selfservices/reCap",
      },
    }
  );
  const json = (await res.json()) as Record<string, number>;
  return parseSectionResponse(json, districtId);
}

// ---------------------------------------------------------------------------
// Normalisation — strips "electrical section", "section", non-alphanumeric
// so "Pallimukku Electrical Section" and "Pallimukku" both → "pallimukku"
// ---------------------------------------------------------------------------
function normalizeSection(value: string): string {
  return value
    .toLowerCase()
    .replace(/\belectrical\s+section\b/g, "")
    .replace(/\belectrical\b/g, "")
    .replace(/\bsection\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Lookup a section by name — async, dynamic fetch
// ---------------------------------------------------------------------------
export async function lookupOfficeBySectionAsync(sectionName: string): Promise<KsebOffice> {
  const normalized = normalizeSection(sectionName);
  if (!normalized) {
    throw new Error("Section name is empty — cannot look up KSEB office code.");
  }

  const offices = await getOfficeList();

  // 1. Exact normalised match on sectionName or fullName
  const exact = offices.find(
    (o) =>
      normalizeSection(o.sectionName) === normalized ||
      normalizeSection(o.fullName) === normalized
  );
  if (exact) return exact;

  // 2. Partial / contains match
  const partial = offices.find(
    (o) =>
      normalizeSection(o.fullName).includes(normalized) ||
      normalized.includes(normalizeSection(o.sectionName))
  );
  if (partial) return partial;

  throw new Error(
    `No KSEB electrical section found matching "${sectionName}". ` +
      `Check that the section name on your bill exactly matches a KSEB electrical section.`
  );
}

// ---------------------------------------------------------------------------
// Kept for backward compatibility (synchronous, seed-only — tests etc.)
// ---------------------------------------------------------------------------
export function lookupOfficeBySection(sectionName: string): KsebOffice {
  throw new Error(
    `lookupOfficeBySection is synchronous and can only check a seed list. ` +
      `Use lookupOfficeBySectionAsync("${sectionName}") instead.`
  );
}
