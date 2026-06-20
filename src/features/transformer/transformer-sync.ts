import {
  getKnownSectionCodes,
  syncSectionTransformers,
} from "@/features/transformer/transformer-cache";
import { getOfficeList, getOfficesByDistrict, DISTRICT_ID_TO_NAME } from "@/integrations/kseb/office-map";
import { fetchResCapacityByOfficeCode } from "@/integrations/kseb/res-capacity";
import { supabaseCount, supabaseRest } from "@/integrations/supabase/client";

export interface TransformerSyncOptions {
  limit?: number;
  offset?: number;
  section?: string | null;
  districtId?: number | null;
  /** discover=true: scan ALL sections in the district and insert missing transformers only. */
  discover?: boolean;
  concurrency?: number;
  runId?: string | null;
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

export async function startRefreshRun(options: {
  discover?: boolean;
  districtId?: number | null;
  runType?: "REFRESH" | "DISCOVERY";
  triggeredBy?: string;
}): Promise<{ runId: string; totalSections: number }> {
  const discover = options.discover ?? false;
  const runType = options.runType ?? "REFRESH";
  let selectedOffices: Array<{ officeCode: string; sectionName: string; districtId: number }>;

  if (options.districtId != null && discover) {
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

  // Stale Run Handling: Auto-expire any active runs older than 6 hours
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    await supabaseRest(`refresh_runs?status=eq.RUNNING&started_at=lt.${encodeURIComponent(sixHoursAgo)}`, {
      method: "PATCH",
      body: {
        status: "TIMEOUT",
        completed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to clean up stale runs (non-fatal):", error);
  }

  // Retention Policy: Delete refresh_changes records older than 180 days
  try {
    const retentionDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseRest(`refresh_changes?changed_at=lt.${encodeURIComponent(retentionDate)}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Failed to prune old refresh changes (non-fatal):", error);
  }

  // 1. Insert into refresh_runs
  const runResponse = await supabaseRest<any[]>("refresh_runs", {
    method: "POST",
    prefer: "return=representation",
    body: [
      {
        status: "RUNNING",
        run_type: runType,
        triggered_by: options.triggeredBy ?? "api",
        total_sections: totalSections,
        metadata: { discover, districtId: options.districtId || null },
      },
    ],
  });

  const run = runResponse?.[0];
  if (!run) {
    throw new Error("Failed to create refresh run in database.");
  }

  const runId = run.id;

  // 2. Group by districtId and count sections
  const districtCounts: Record<number, number> = {};
  for (const office of selectedOffices) {
    if (!office.districtId) {
      throw new Error(`Section ${office.officeCode} (${office.sectionName}) has missing or invalid district ID.`);
    }
    districtCounts[office.districtId] = (districtCounts[office.districtId] || 0) + 1;
  }

  // 3. Insert into district_refresh_progress
  const progressBodies = Object.entries(districtCounts).map(([distIdStr, count]) => {
    const distId = Number(distIdStr);
    const distName = DISTRICT_ID_TO_NAME[distId] || `District ${distId}`;
    return {
      run_id: runId,
      district_id: distId,
      district_name: distName,
      total_sections: count,
      processed_sections: 0,
      transformers: 0,
      updated: 0,
      status: "PENDING",
    };
  });

  if (progressBodies.length > 0) {
    await supabaseRest("district_refresh_progress", {
      method: "POST",
      body: progressBodies,
    });
  }

  return { runId, totalSections };
}

export async function completeRefreshRun(
  runId: string,
  status: string = "COMPLETED",
  failureReason?: string | null
): Promise<void> {
  await supabaseRest("rpc/complete_refresh_run", {
    method: "POST",
    body: {
      p_run_id: runId,
      p_status: status,
      p_failure_reason: failureReason || null,
    },
  });
}

export async function syncTransformerCapacities(
  options: TransformerSyncOptions = {}
): Promise<TransformerSyncResult> {
  const discover = options.discover ?? false;
  let selectedOffices: Array<{ officeCode: string; sectionName: string; districtId: number }>;

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

  const runId = options.runId;

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
          discover,
          runId,
          office.districtId
        );
        transformers += result.transformers;
        inserted += result.inserted;
        updated += result.updated;
        skipped += result.skipped;
        historyRecorded += result.historyRecorded;

        if (runId) {
          await supabaseRest("rpc/increment_refresh_progress", {
            method: "POST",
            body: {
              p_run_id: runId,
              p_district_id: office.districtId,
              p_transformers: result.transformers,
              p_inserted: result.inserted,
              p_updated: result.updated,
              p_skipped: result.skipped,
              p_failures: 0,
              p_offset: offset,
            },
          });
        }
      } catch (error) {
        if (isEmptySectionError(error)) {
          if (runId) {
            await supabaseRest("rpc/increment_refresh_progress", {
              method: "POST",
              body: {
                p_run_id: runId,
                p_district_id: office.districtId,
                p_transformers: 0,
                p_inserted: 0,
                p_updated: 0,
                p_skipped: 0,
                p_failures: 0,
                p_offset: offset,
              },
            });
          }
          continue;
        }
        
        failures.push({
          sectionCode: office.officeCode,
          sectionName: office.sectionName,
          error: error instanceof Error ? error.message : "Unknown sync error",
        });

        if (runId) {
          await supabaseRest("rpc/increment_refresh_progress", {
            method: "POST",
            body: {
              p_run_id: runId,
              p_district_id: office.districtId,
              p_transformers: 0,
              p_inserted: 0,
              p_updated: 0,
              p_skipped: 0,
              p_failures: 1,
              p_offset: offset,
            },
          });
        }
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, selectedOffices.length || 1) }, () =>
      syncNextOffice()
    )
  );

  if (discover) {
    const invalidCount = await supabaseCount("transformers?kseb_transformer_id=imatch.[^0-9]");
    if (invalidCount > 0) {
      throw new Error("Invalid transformer IDs detected");
    }
  }

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
