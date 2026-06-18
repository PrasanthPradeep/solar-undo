import { upsertHistory, upsertTransformer } from "@/features/transformer/transformer-cache";
import { getOfficeList } from "@/integrations/kseb/office-map";
import { fetchResCapacityByOfficeCode } from "@/integrations/kseb/res-capacity";

export interface TransformerSyncOptions {
  limit?: number;
  section?: string | null;
  concurrency?: number;
}

export interface TransformerSyncResult {
  success: boolean;
  sections: number;
  transformers: number;
  failures: Array<{ sectionCode: string; sectionName: string; error: string }>;
  timestamp: string;
}

export async function syncTransformerCapacities(
  options: TransformerSyncOptions = {}
): Promise<TransformerSyncResult> {
  const offices = options.section
    ? (await getOfficeList()).filter((office) => office.officeCode === options.section)
    : await getOfficeList();
  const selectedOffices =
    options.limit && options.limit > 0 ? offices.slice(0, options.limit) : offices;
  const concurrency = Math.min(Math.max(options.concurrency ?? 4, 1), 8);

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
