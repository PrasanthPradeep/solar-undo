import { getKnownSectionCodes, upsertHistory, upsertTransformer } from "@/features/transformer/transformer-cache";
import { getOfficeList, getOfficesByDistrict } from "@/integrations/kseb/office-map";
import { fetchResCapacityByOfficeCode } from "@/integrations/kseb/res-capacity";

export interface TransformerSyncOptions {
  limit?: number;
  section?: string | null;
  districtId?: number | null;
  /** discover=true: scan ALL sections in the district (slow). Default: only refresh known DB sections. */
  discover?: boolean;
  concurrency?: number;
}

export interface TransformerSyncResult {
  success: boolean;
  sections: number;
  transformers: number;
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
  let selectedOffices: Array<{ officeCode: string; sectionName: string }>;

  if (options.section) {
    // Single-section override
    const all = options.districtId != null
      ? await getOfficesByDistrict(options.districtId)
      : await getOfficeList();
    selectedOffices = all.filter((o) => o.officeCode === options.section);
  } else if (options.districtId != null && options.discover) {
    // Full district discovery scan (slow — use sparingly)
    selectedOffices = await getOfficesByDistrict(options.districtId);
  } else if (options.districtId != null) {
    // Refresh only known sections in this district
    const [districtOffices, knownCodes] = await Promise.all([
      getOfficesByDistrict(options.districtId),
      getKnownSectionCodes(),
    ]);
    const knownSet = new Set(knownCodes);
    selectedOffices = districtOffices.filter((o) => knownSet.has(o.officeCode));
  } else {
    // No district specified — refresh all known sections across all districts
    const knownCodes = await getKnownSectionCodes();
    const all = await getOfficeList();
    const knownSet = new Set(knownCodes);
    selectedOffices = all.filter((o) => knownSet.has(o.officeCode));
  }

  if (options.limit && options.limit > 0) {
    selectedOffices = selectedOffices.slice(0, options.limit);
  }

  const concurrency = Math.min(Math.max(options.concurrency ?? 8, 1), 16);
  let transformers = 0;
  const failures: TransformerSyncResult["failures"] = [];

  let cursor = 0;
  async function syncNextOffice() {
    while (cursor < selectedOffices.length) {
      const office = selectedOffices[cursor];
      cursor += 1;
      if (!office) return;

      try {
        const rows = await fetchResCapacityByOfficeCode(office.officeCode);
        for (const row of rows) {
          const saved = await upsertTransformer(row, office.officeCode, office.sectionName);
          const transformer = saved[0];
          if (transformer) {
            await upsertHistory(transformer.id, row.balanceAvailable);
            transformers += 1;
          }
        }
      } catch (error) {
        // Sections with no transformers are expected — don't count as failures
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
    transformers,
    failures,
    timestamp: new Date().toISOString(),
  };
}
