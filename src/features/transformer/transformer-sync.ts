import {
  getKnownSectionCodes,
  syncSectionTransformers,
} from "@/features/transformer/transformer-cache";
import { getOfficeList, getOfficesByDistrict } from "@/integrations/kseb/office-map";
import { fetchResCapacityByOfficeCode } from "@/integrations/kseb/res-capacity";

export interface TransformerSyncOptions {
  limit?: number;
  offset?: number;
  section?: string | null;
  districtId?: number | null;
  /** discover=true: scan ALL sections in the district and insert missing transformers only. */
  discover?: boolean;
  concurrency?: number;
}

export interface TransformerSyncResult {
  success: boolean;
  sections: number;
  totalSections: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  transformers: number;
  inserted: number;
  updated: number;
  skipped: number;
  historyRecorded: number;
  failures: Array<{ sectionCode: string; sectionName: string; error: string }>;
  timestamp: string;
}

/** KSEB returns these errors for sections that simply have no registered transformers yet — not real failures. */
function isEmptySectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("no transformer data") ||
    error.message.includes("not have any registered transformers") ||
    error.message.includes("could not be parsed") ||
    error.message.includes("non-JSON response")
  );
}

export async function syncTransformerCapacities(
  options: TransformerSyncOptions = {}
): Promise<TransformerSyncResult> {
  const discover = options.discover ?? false;
  let selectedOffices: Array<{ officeCode: string; sectionName: string }>;

  if (options.section) {
    const all =
      options.districtId != null
        ? await getOfficesByDistrict(options.districtId)
        : await getOfficeList();
    selectedOffices = all.filter((o) => o.officeCode === options.section);
  } else if (options.districtId != null && discover) {
    selectedOffices = await getOfficesByDistrict(options.districtId);
  } else if (options.districtId != null) {
    const [districtOffices, knownCodes] = await Promise.all([
      getOfficesByDistrict(options.districtId),
      getKnownSectionCodes(),
    ]);
    const knownSet = new Set(knownCodes);
    selectedOffices = districtOffices.filter((o) => knownSet.has(o.officeCode));
  } else {
    const knownCodes = await getKnownSectionCodes();
    const all = await getOfficeList();
    const knownSet = new Set(knownCodes);
    selectedOffices = all.filter((o) => knownSet.has(o.officeCode));
  }

  const totalSections = selectedOffices.length;
  const offset = Math.max(options.offset ?? 0, 0);
  const limit = Math.max(options.limit ?? 0, 0);
  selectedOffices =
    limit > 0 ? selectedOffices.slice(offset, offset + limit) : selectedOffices.slice(offset);

  const defaultConcurrency = discover ? 8 : 20;
  const concurrency = Math.min(Math.max(options.concurrency ?? defaultConcurrency, 1), 20);
  let transformers = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let historyRecorded = 0;
  const failures: TransformerSyncResult["failures"] = [];

  let cursor = 0;
  async function syncNextOffice() {
    while (cursor < selectedOffices.length) {
      const office = selectedOffices[cursor];
      cursor += 1;
      if (!office) return;

      try {
        const rows = await fetchResCapacityByOfficeCode(office.officeCode);
        const result = await syncSectionTransformers(
          office.officeCode,
          office.sectionName,
          rows,
          discover
        );
        transformers += result.transformers;
        inserted += result.inserted;
        updated += result.updated;
        skipped += result.skipped;
        historyRecorded += result.historyRecorded;
      } catch (error) {
        if (isEmptySectionError(error)) continue;
        failures.push({
          sectionCode: office.officeCode,
          sectionName: office.sectionName,
          error: error instanceof Error ? error.message : "Unknown sync error",
        });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, selectedOffices.length || 1) }, () =>
      syncNextOffice()
    )
  );

  return {
    success: failures.length === 0,
    sections: selectedOffices.length,
    totalSections,
    offset,
    limit,
    hasMore: offset + selectedOffices.length < totalSections,
    transformers,
    inserted,
    updated,
    skipped,
    historyRecorded,
    failures,
    timestamp: new Date().toISOString(),
  };
}
