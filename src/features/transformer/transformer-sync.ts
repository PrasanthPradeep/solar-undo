import { upsertHistory, upsertTransformer } from "@/features/transformer/transformer-cache";
import { getOfficeList, getOfficesByDistrict } from "@/integrations/kseb/office-map";
import { fetchResCapacityByOfficeCode } from "@/integrations/kseb/res-capacity";

export interface TransformerSyncOptions {
  limit?: number;
  section?: string | null;
  districtId?: number | null;
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
  // When a districtId is given, only fetch that district's sections (1 API call instead of 14)
  const allOffices =
    options.districtId != null
      ? await getOfficesByDistrict(options.districtId)
      : await getOfficeList();

  const offices = options.section
    ? allOffices.filter((office) => office.officeCode === options.section)
    : allOffices;

  const selectedOffices =
    options.limit && options.limit > 0 ? offices.slice(0, options.limit) : offices;
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
    Array.from({ length: Math.min(concurrency, selectedOffices.length) }, () => syncNextOffice())
  );

  return {
    success: failures.length === 0,
    sections: selectedOffices.length,
    transformers,
    failures,
    timestamp: new Date().toISOString(),
  };
}
