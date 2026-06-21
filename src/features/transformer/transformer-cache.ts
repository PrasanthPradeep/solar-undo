import { calculateSolarEligibility } from "@/features/solar/solar-calculator";
import { SolarAvailabilityResponse } from "@/integrations/kseb/solar-availability";
import { normalizeTransformerName, ResTransformerCapacity } from "@/integrations/kseb/res-capacity";
import { getOfficeList, DISTRICT_ID_TO_NAME } from "@/integrations/kseb/office-map";
import { supabaseCount, supabaseRest, SupabaseUnavailableError } from "@/integrations/supabase/client";
import { validateKsebId } from "@/utils/validators";

/** Returns the distinct section_codes of all transformers already cached in the DB. */
export async function getKnownSectionCodes(): Promise<string[]> {
  try {
    const rows = await supabaseRest<Array<{ section_code: string }>>(
      "unique_sections?select=section_code"
    );
    return rows.map((r) => r.section_code);
  } catch (error) {
    console.warn("unique_sections view query failed, falling back to keyset pagination", error);
    const uniqueCodes = new Set<string>();
    let lastCode = "";
    while (true) {
      const filter = lastCode ? `&section_code=gt.${encodeURIComponent(lastCode)}` : "";
      const rows = await supabaseRest<Array<{ section_code: string }>>(
        `transformers?select=section_code&order=section_code&limit=1000${filter}`
      );
      if (!rows || rows.length === 0) break;
      for (const r of rows) {
        uniqueCodes.add(r.section_code);
      }
      const lastRow = rows[rows.length - 1];
      if (lastRow) {
        lastCode = lastRow.section_code;
      }
      if (rows.length < 1000) break;
    }
    return Array.from(uniqueCodes);
  }
}

export interface CapacityTrendPoint {
  date: string;
  availableKw: number;
}

export interface CapacityChange {
  deltaKw: number;
  previousKw: number;
  currentKw: number;
}

export interface CoverageStats {
  districtsIndexed: number;
  sectionsIndexed: number;
  transformersIndexed: number;
}

export interface HistorySnapshot {
  availableKw: number;
  capacity: number;
  allowedCap: number;
  feasible: number;
  regi: number;
  compCap: number;
}

interface TransformerRow {
  id: string;
  kseb_transformer_id: string;
  transformer_name: string;
  feeder_name: string | null;
  section_code: string;
  section_name: string | null;
  capacity: number;
  allowed_cap: number;
  feasible: number;
  regi: number;
  comp_cap: number;
  available_kw: number;
  last_updated: string;
}

interface ConsumerTransformerRow {
  consumer_no: string;
  transformer_name: string;
  transformer_id: string | null;
  feeder_name?: string | null;
  section_code: string;
  updated_at: string;
  last_seen?: string;
  consumer_name?: string | null;
  section_name?: string | null;
  tariff?: string | null;
  bill_no?: string | null;
  mobile?: string | null;
  office_phone?: string | null;
  transformers?: TransformerRow | null;
}

interface HistoryRow {
  available_kw: number;
  recorded_at: string;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isRecoverableSupabaseCacheError(error: unknown) {
  if (!(error instanceof Error)) return false;

  return (
    error.message.includes("PGRST205") ||
    error.message.includes("PGRST204") ||
    error.message.includes("Could not find the table") ||
    error.message.includes("Could not find a relationship") ||
    error.message.includes("permission denied") ||
    error.message.includes('"code":"42501"')
  );
}

function isMissingConflictConstraintError(error: unknown) {
  return error instanceof Error && error.message.includes('"code":"42P10"');
}

function isDuplicateKeyError(error: unknown) {
  return error instanceof Error && error.message.includes('"code":"23505"');
}

function isMissingColumnError(error: unknown) {
  return error instanceof Error && error.message.includes("PGRST204");
}

function toAvailability(row: TransformerRow) {
  const balanceAvailable = Math.max(0, row.allowed_cap - row.feasible - row.regi - row.comp_cap);
  return {
    transformerName: row.transformer_name,
    feederName: row.feeder_name ?? "",
    officeCode: row.section_code,
    sectionName: row.section_name ?? "",
    dtrCapacity: row.capacity,
    dtr90Capacity: row.allowed_cap,
    feasibilityIssued: row.feasible,
    registrations: row.regi,
    gridConnected: row.comp_cap,
    balanceAvailable,
    solarAvailable: balanceAvailable > 0,
    status: calculateSolarEligibility(balanceAvailable).status,
    asOn: row.last_updated,
  };
}

function snapshotFromRow(row: ResTransformerCapacity): HistorySnapshot {
  return {
    availableKw: row.balanceAvailable,
    capacity: row.dtrCapacity,
    allowedCap: row.dtr90Capacity,
    feasible: row.feasibilityIssued,
    regi: row.registrations,
    compCap: row.gridConnected,
  };
}

function snapshotFromTransformerRow(row: TransformerRow): HistorySnapshot {
  const availableKw = Math.max(0, row.allowed_cap - row.feasible - row.regi - row.comp_cap);
  return {
    availableKw,
    capacity: row.capacity,
    allowedCap: row.allowed_cap,
    feasible: row.feasible,
    regi: row.regi,
    compCap: row.comp_cap,
  };
}

function snapshotsEqual(a: HistorySnapshot, b: HistorySnapshot) {
  return (
    a.availableKw === b.availableKw &&
    a.capacity === b.capacity &&
    a.allowedCap === b.allowedCap &&
    a.feasible === b.feasible &&
    a.regi === b.regi &&
    a.compCap === b.compCap
  );
}

async function getHistory(transformerId: string): Promise<HistoryRow[]> {
  return supabaseRest<HistoryRow[]>(
    `transformer_history?transformer_id=eq.${encodeURIComponent(transformerId)}` +
      "&select=available_kw,recorded_at&order=recorded_at.desc&limit=7"
  );
}

async function getLatestHistorySnapshot(transformerId: string): Promise<HistorySnapshot | null> {
  const rows = await supabaseRest<
    Array<{
      available_kw: number;
      capacity: number;
      allowed_cap: number;
      feasible: number;
      regi: number;
      comp_cap: number;
    }>
  >(
    `transformer_history?transformer_id=eq.${encodeURIComponent(transformerId)}` +
      "&select=available_kw,capacity,allowed_cap,feasible,regi,comp_cap&order=recorded_at.desc&limit=1"
  );
  const row = rows[0];
  if (!row) return null;

  return {
    availableKw: row.available_kw,
    capacity: row.capacity,
    allowedCap: row.allowed_cap,
    feasible: row.feasible,
    regi: row.regi,
    compCap: row.comp_cap,
  };
}

function buildAnalytics(history: HistoryRow[], currentKw: number) {
  const ordered = [...history].reverse();
  const trend: CapacityTrendPoint[] = ordered.map((row) => ({
    date: row.recorded_at.slice(0, 10),
    availableKw: row.available_kw,
  }));

  const latestTwo = [...history].slice(0, 2);
  const latest = latestTwo[0]?.available_kw ?? currentKw;
  const previous = latestTwo[1]?.available_kw;
  const change =
    previous == null
      ? null
      : {
          deltaKw: latest - previous,
          previousKw: previous,
          currentKw: latest,
        };

  return { trend, change };
}

export async function getCoverageStats(): Promise<CoverageStats | null> {
  try {
    const [sectionCodes, transformerCount] = await Promise.all([
      getKnownSectionCodes(),
      supabaseCount("transformers?select=id"),
    ]);

    let districtsIndexed = 1;
    try {
      const offices = await getOfficeList();
      const sectionToDistrict = new Map(offices.map((office) => [office.officeCode, office.districtId]));
      const districtIds = new Set(
        sectionCodes.map((code) => sectionToDistrict.get(code)).filter((id): id is number => id != null)
      );
      districtsIndexed = districtIds.size || 1;
    } catch {
      districtsIndexed = 1;
    }

    return {
      districtsIndexed,
      sectionsIndexed: sectionCodes.length,
      transformersIndexed: transformerCount,
    };
  } catch (error) {
    if (error instanceof SupabaseUnavailableError || isRecoverableSupabaseCacheError(error)) {
      return null;
    }
    throw error;
  }
}

export async function logSearch(consumerNo: string, transformerId?: string | null) {
  try {
    await supabaseRest("search_logs", {
      method: "POST",
      body: [
        {
          consumer_no: consumerNo,
          transformer_id: transformerId ?? null,
          searched_at: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    if (error instanceof SupabaseUnavailableError || isRecoverableSupabaseCacheError(error)) return;
    console.error("Failed to log search", error);
  }
}

export async function updateLastSeen(consumerNo: string) {
  try {
    await supabaseRest(`consumer_transformers?consumer_no=eq.${encodeURIComponent(consumerNo)}`, {
      method: "PATCH",
      body: {
        last_seen: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof SupabaseUnavailableError || isRecoverableSupabaseCacheError(error)) return;
    console.error("Failed to update last_seen", error);
  }
}

export async function getCachedAvailabilityByConsumer(consumerNo: string) {
  try {
    const rows = await supabaseRest<ConsumerTransformerRow[]>(
      `consumer_transformers?consumer_no=eq.${encodeURIComponent(consumerNo)}` +
        "&select=*,transformers(*)&limit=1"
    );
    const mapping = rows[0];
    const transformer = mapping?.transformers;
    if (!mapping || !transformer) return null;

    const availability = toAvailability(transformer);
    const history = await getHistory(transformer.id);
    const analytics = buildAnalytics(history, availability.balanceAvailable);

    await logSearch(consumerNo, transformer.id);
    await updateLastSeen(consumerNo);

    return {
      ...availability,
      consumerName: mapping.consumer_name ?? "Returning consumer",
      consumerNumber: mapping.consumer_no,
      sectionName: mapping.section_name ?? availability.sectionName,
      office_phone: mapping.office_phone ?? "",
      billNo: mapping.bill_no ?? "",
      tariff: mapping.tariff ?? "",
      mobile: mapping.mobile ?? "",
      source: "cache" as const,
      history: analytics.trend,
      capacityChange: analytics.change,
    };
  } catch (error) {
    if (error instanceof SupabaseUnavailableError || isRecoverableSupabaseCacheError(error)) {
      return null;
    }
    throw error;
  }
}

export async function enrichWithHistory(data: SolarAvailabilityResponse) {
  try {
    const rows = await supabaseRest<TransformerRow[]>(
      `transformers?section_code=eq.${encodeURIComponent(data.officeCode)}` +
        `&transformer_name=eq.${encodeURIComponent(normalizeTransformerName(data.transformerName))}` +
        "&select=*&limit=1"
    );
    const transformer = rows[0];
    if (!transformer) return { ...data, source: "live" as const, history: [], capacityChange: null };

    const history = await getHistory(transformer.id);
    const analytics = buildAnalytics(history, data.balanceAvailable);
    return {
      ...data,
      source: "live" as const,
      history: analytics.trend,
      capacityChange: analytics.change,
    };
  } catch (error) {
    if (error instanceof SupabaseUnavailableError || isRecoverableSupabaseCacheError(error)) {
      return { ...data, source: "live" as const, history: [], capacityChange: null };
    }
    throw error;
  }
}

export async function saveConsumerMapping(data: SolarAvailabilityResponse, mobile?: string) {
  try {
    const transformerRows = await upsertTransformer(
      {
        transformerName: data.transformerName,
        feederName: data.feederName,
        dtrCapacity: data.dtrCapacity,
        dtr90Capacity: data.dtr90Capacity,
        feasibilityIssued: data.feasibilityIssued,
        registrations: data.registrations,
        gridConnected: data.gridConnected,
        balanceAvailable: data.balanceAvailable,
      },
      data.officeCode,
      data.sectionName
    );

    const transformer = transformerRows[0];
    if (!transformer) return;

    try {
      await recordHistoryIfChanged(transformer.id, snapshotFromRow({
        transformerName: data.transformerName,
        feederName: data.feederName,
        dtrCapacity: data.dtrCapacity,
        dtr90Capacity: data.dtr90Capacity,
        feasibilityIssued: data.feasibilityIssued,
        registrations: data.registrations,
        gridConnected: data.gridConnected,
        balanceAvailable: data.balanceAvailable,
      }));
    } catch (historyError) {
      console.error("Failed to record transformer history (non-fatal):", historyError);
    }

    const fullMapping = {
      consumer_no: data.consumerNumber,
      transformer_name: data.transformerName,
      transformer_id: transformer.id,
      feeder_name: data.feederName,
      section_code: data.officeCode,
      consumer_name: data.consumerName,
      section_name: data.sectionName,
      tariff: data.tariff,
      bill_no: data.billNo,
      mobile: mobile ?? null,
      office_phone: data.office_phone,
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    };

    try {
      await supabaseRest("consumer_transformers?on_conflict=consumer_no", {
        method: "POST",
        prefer: "resolution=merge-duplicates",
        body: [fullMapping],
      });
    } catch (error) {
      if (!isMissingColumnError(error)) throw error;

      await supabaseRest("consumer_transformers?on_conflict=consumer_no", {
        method: "POST",
        prefer: "resolution=merge-duplicates",
        body: [
          {
            consumer_no: fullMapping.consumer_no,
            transformer_name: fullMapping.transformer_name,
            transformer_id: fullMapping.transformer_id,
            section_code: fullMapping.section_code,
            updated_at: fullMapping.updated_at,
          },
        ],
      });
    }
  } catch (error) {
    if (error instanceof SupabaseUnavailableError || isRecoverableSupabaseCacheError(error)) return;
    console.error("Failed to save consumer transformer cache", error);
  }
}

export async function findTransformer(sectionCode: string, transformerName: string) {
  const normalized = normalizeTransformerName(transformerName);
  const rows = await supabaseRest<TransformerRow[]>(
    `transformers?section_code=eq.${encodeURIComponent(sectionCode)}` +
      `&transformer_name=eq.${encodeURIComponent(normalized)}` +
      "&select=*&limit=1"
  );
  return rows[0] ?? null;
}

export async function insertTransformerIfMissing(
  row: ResTransformerCapacity,
  sectionCode: string,
  sectionName: string
) {
  const existing = await findTransformer(sectionCode, row.transformerName);
  if (existing) {
    return { inserted: false, transformer: existing };
  }

  const saved = await upsertTransformer(row, sectionCode, sectionName);
  const transformer = saved[0];
  if (!transformer) {
    return { inserted: false, transformer: null };
  }

  await recordHistoryIfChanged(transformer.id, snapshotFromRow(row));
  return { inserted: true, transformer };
}

export async function upsertTransformer(
  row: ResTransformerCapacity,
  sectionCode: string,
  sectionName: string
) {
  const transformerName = normalizeTransformerName(row.transformerName);
  const existing = await findTransformer(sectionCode, transformerName);

  let ksebTransformerId = row.ksebTransformerId ? String(row.ksebTransformerId).trim() : "";

  // Preserve existing numeric ID if KSEB temporarily omits it
  if (
    existing?.kseb_transformer_id &&
    /^\d+$/.test(existing.kseb_transformer_id) &&
    !ksebTransformerId
  ) {
    console.warn(`Preserving existing KSEB ID for ${transformerName}`);
    ksebTransformerId = existing.kseb_transformer_id;
  }

  ksebTransformerId = validateKsebId(ksebTransformerId);

  const body = {
    kseb_transformer_id: ksebTransformerId,
    transformer_name: transformerName,
    feeder_name: row.feederName,
    section_code: sectionCode,
    section_name: sectionName,
    capacity: row.dtrCapacity,
    allowed_cap: row.dtr90Capacity,
    feasible: row.feasibilityIssued,
    regi: row.registrations,
    comp_cap: row.gridConnected,
    available_kw: row.balanceAvailable,
    last_updated: new Date().toISOString(),
  };

  try {
    return await supabaseRest<TransformerRow[]>("transformers?on_conflict=section_code,transformer_name", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: [body],
    });
  } catch (error) {
    if (!isMissingConflictConstraintError(error) && !isDuplicateKeyError(error)) throw error;

    let existing = await supabaseRest<TransformerRow[]>(
      `transformers?kseb_transformer_id=eq.${encodeURIComponent(ksebTransformerId)}&select=*&limit=1`
    );

    if (!existing[0]) {
      existing = await supabaseRest<TransformerRow[]>(
        `transformers?section_code=eq.${encodeURIComponent(sectionCode)}` +
          `&transformer_name=eq.${encodeURIComponent(transformerName)}` +
          "&select=*&limit=1"
      );
    }

    if (existing[0]) {
      return supabaseRest<TransformerRow[]>(`transformers?id=eq.${existing[0].id}&select=*`, {
        method: "PATCH",
        prefer: "return=representation",
        body,
      });
    }

    return supabaseRest<TransformerRow[]>("transformers?select=*", {
      method: "POST",
      prefer: "return=representation",
      body: [body],
    });
  }
}

export async function recordHistoryIfChanged(transformerId: string, snapshot: HistorySnapshot) {
  const latest = await getLatestHistorySnapshot(transformerId);
  if (latest && snapshotsEqual(latest, snapshot)) {
    return false;
  }

  const body = {
    transformer_id: transformerId,
    available_kw: snapshot.availableKw,
    capacity: snapshot.capacity,
    allowed_cap: snapshot.allowedCap,
    feasible: snapshot.feasible,
    regi: snapshot.regi,
    comp_cap: snapshot.compCap,
    recorded_date: todayIsoDate(),
    recorded_at: new Date().toISOString(),
  };

  await supabaseRest("transformer_history", {
    method: "POST",
    body: [body],
  });
  return true;
}

/** @deprecated Use recordHistoryIfChanged instead. */
export async function upsertHistory(transformerId: string, availableKw: number) {
  await recordHistoryIfChanged(transformerId, {
    availableKw,
    capacity: 0,
    allowedCap: 0,
    feasible: 0,
    regi: 0,
    compCap: 0,
  });
}

export async function refreshTransformer(
  row: ResTransformerCapacity,
  sectionCode: string,
  sectionName: string,
  runId?: string | null,
  districtId?: number | null
) {
  console.log("refreshTransformer RUN_ID:", runId);
  const existing = await findTransformer(sectionCode, row.transformerName);
  const saved = await upsertTransformer(row, sectionCode, sectionName);
  const transformer = saved[0];
  if (!transformer) return { updated: false, historyRecorded: false };

  const snapshot = snapshotFromRow(row);
  const previousSnapshot = existing ? snapshotFromTransformerRow(existing) : null;
  const historyRecorded = await recordHistoryIfChanged(
    transformer.id,
    snapshot
  );

  const changed = !previousSnapshot || !snapshotsEqual(previousSnapshot, snapshot);

  if (changed && runId) {
    const changesList = [];
    const fieldsToCompare: Array<{ key: keyof HistorySnapshot; label: string }> = [
      { key: "availableKw", label: "available_capacity" },
      { key: "capacity", label: "capacity" },
      { key: "allowedCap", label: "allowed_cap" },
      { key: "feasible", label: "feasible" },
      { key: "regi", label: "regi" },
      { key: "compCap", label: "comp_cap" },
    ];

    for (const field of fieldsToCompare) {
      const oldValue = previousSnapshot ? previousSnapshot[field.key] : 0;
      const newValue = snapshot[field.key];
      if (!previousSnapshot || oldValue !== newValue) {
        changesList.push({
          run_id: runId,
          district_id: districtId || null,
          section_code: sectionCode,
          transformer_id: transformer.kseb_transformer_id,
          transformer_uuid: transformer.id,
          field_name: field.label,
          old_value: String(oldValue),
          new_value: String(newValue),
          section_name: sectionName,
          district_name: districtId ? (DISTRICT_ID_TO_NAME[districtId] || null) : null,
          transformer_name: transformer.transformer_name,
        });
      }
    }

    if (changesList.length > 0) {
      try {
        await supabaseRest("refresh_changes", {
          method: "POST",
          body: changesList,
        });
      } catch (err) {
        console.error("Failed to insert refresh changes in sequential mode", err);
      }
    }
  }

  return {
    updated: !!previousSnapshot && changed,
    inserted: !previousSnapshot,
    historyRecorded,
  };
}

export async function syncSectionTransformers(
  officeCode: string,
  sectionName: string,
  rows: ResTransformerCapacity[],
  discover: boolean,
  runId?: string | null,
  districtId?: number | null
) {
  console.log("syncSectionTransformers RUN_ID:", runId);
  // 1. Fetch all existing cached transformers for this section
  const existingTransformers = await supabaseRest<TransformerRow[]>(
    `transformers?section_code=eq.${encodeURIComponent(officeCode)}&select=*`
  );
  const existingByNameMap = new Map(existingTransformers.map((t) => [t.transformer_name, t]));
  const existingByIdMap = new Map(existingTransformers.map((t) => [t.kseb_transformer_id, t]));

  let transformers = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let historyRecorded = 0;

  if (discover) {
    // Discovery mode: only insert if missing.
    // Deduplicate KSEB rows by normalized name to avoid duplicate key errors on insert.
    const newRowsMap = new Map<string, ResTransformerCapacity>();
    for (const row of rows) {
      const normalizedName = normalizeTransformerName(row.transformerName);
      const ksebId = row.ksebTransformerId;
      const exists = existingByNameMap.has(normalizedName) || (ksebId !== undefined && existingByIdMap.has(ksebId));
      if (exists) {
        transformers += 1;
        skipped += 1;
      } else if (!newRowsMap.has(normalizedName)) {
        newRowsMap.set(normalizedName, row);
      }
    }

    const newRowsToInsert = Array.from(newRowsMap.values());

    if (newRowsToInsert.length > 0) {
      const bodies = newRowsToInsert.map((row) => {
        const transformerName = normalizeTransformerName(row.transformerName);
        const ksebTransformerId = validateKsebId(row.ksebTransformerId ?? "");
        return {
          kseb_transformer_id: ksebTransformerId,
          transformer_name: transformerName,
          feeder_name: row.feederName,
          section_code: officeCode,
          section_name: sectionName,
          capacity: row.dtrCapacity,
          allowed_cap: row.dtr90Capacity,
          feasible: row.feasibilityIssued,
          regi: row.registrations,
          comp_cap: row.gridConnected,
          available_kw: row.balanceAvailable,
          last_updated: new Date().toISOString(),
        };
      });

      try {
        // Bulk insert new transformers (on_conflict targets section_code,transformer_name to migrate existing records to new ID format)
        const saved = await supabaseRest<TransformerRow[]>("transformers?on_conflict=section_code,transformer_name", {
          method: "POST",
          prefer: "resolution=merge-duplicates,return=representation",
          body: bodies,
        });

        if (saved && saved.length > 0) {
          transformers += saved.length;
          inserted += saved.length;

          // Bulk insert initial history for new transformers
          const historyBodies = saved.map((t) => {
            const matchingRow = newRowsToInsert.find(
              (r) => normalizeTransformerName(r.transformerName) === t.transformer_name
            );
            const snapshot = matchingRow ? snapshotFromRow(matchingRow) : {
              availableKw: t.available_kw,
              capacity: t.capacity,
              allowedCap: t.allowed_cap,
              feasible: t.feasible,
              regi: t.regi,
              compCap: t.comp_cap,
            };
            return {
              transformer_id: t.id,
              available_kw: snapshot.availableKw,
              capacity: snapshot.capacity,
              allowed_cap: snapshot.allowedCap,
              feasible: snapshot.feasible,
              regi: snapshot.regi,
              comp_cap: snapshot.compCap,
              recorded_date: todayIsoDate(),
              recorded_at: new Date().toISOString(),
            };
          });

          await supabaseRest("transformer_history", {
            method: "POST",
            body: historyBodies,
          });
        }
      } catch (error) {
        if (!isDuplicateKeyError(error) && !isMissingConflictConstraintError(error)) throw error;
        // Fallback: run sequential upserts
        for (const row of newRowsToInsert) {
          const result = await insertTransformerIfMissing(row, officeCode, sectionName);
          if (result.transformer) {
            transformers += 1;
            if (result.inserted) inserted += 1;
            else skipped += 1;
          }
        }
      }
    }
  } else {
    // Refresh mode: update all and record history if changed.
    const rowsMap = new Map<string, ResTransformerCapacity>();
    for (const row of rows) {
      const normalizedName = normalizeTransformerName(row.transformerName);
      rowsMap.set(normalizedName, row);
    }
    const deduplicatedRows = Array.from(rowsMap.values());

    const bodies = deduplicatedRows.map((row) => {
      const transformerName = normalizeTransformerName(row.transformerName);
      const existing = existingByNameMap.get(transformerName) || (row.ksebTransformerId ? existingByIdMap.get(row.ksebTransformerId) : undefined);
      
      let ksebTransformerId = row.ksebTransformerId ? String(row.ksebTransformerId).trim() : "";

      if (
        existing?.kseb_transformer_id &&
        /^\d+$/.test(existing.kseb_transformer_id) &&
        !ksebTransformerId
      ) {
        console.warn(`Preserving existing KSEB ID for ${transformerName}`);
        ksebTransformerId = existing.kseb_transformer_id;
      }

      ksebTransformerId = validateKsebId(ksebTransformerId);

      return {
        kseb_transformer_id: ksebTransformerId,
        transformer_name: transformerName,
        feeder_name: row.feederName,
        section_code: officeCode,
        section_name: sectionName,
        capacity: row.dtrCapacity,
        allowed_cap: row.dtr90Capacity,
        feasible: row.feasibilityIssued,
        regi: row.registrations,
        comp_cap: row.gridConnected,
        available_kw: row.balanceAvailable,
        last_updated: new Date().toISOString(),
      };
    });

    try {
      // Bulk upsert all transformers
      const saved = await supabaseRest<TransformerRow[]>("transformers?on_conflict=section_code,transformer_name", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=representation",
        body: bodies,
      });

      if (saved && saved.length > 0) {
        transformers = saved.length;
        const historyBodies: Array<{
          transformer_id: string;
          available_kw: number;
          capacity: number;
          allowed_cap: number;
          feasible: number;
          regi: number;
          comp_cap: number;
          recorded_date: string;
          recorded_at: string;
        }> = [];

        for (const t of saved) {
          const matchingRow = deduplicatedRows.find(
            (r) => normalizeTransformerName(r.transformerName) === t.transformer_name
          );
          if (!matchingRow) continue;

          const snapshot = snapshotFromRow(matchingRow);
          const existing = existingByNameMap.get(t.transformer_name) || existingByIdMap.get(t.kseb_transformer_id);
          const previousSnapshot = existing ? snapshotFromTransformerRow(existing) : null;

          const changed = !previousSnapshot || !snapshotsEqual(previousSnapshot, snapshot);
          if (changed) {
            historyRecorded += 1;
            historyBodies.push({
              transformer_id: t.id,
              available_kw: snapshot.availableKw,
              capacity: snapshot.capacity,
              allowed_cap: snapshot.allowedCap,
              feasible: snapshot.feasible,
              regi: snapshot.regi,
              comp_cap: snapshot.compCap,
              recorded_date: todayIsoDate(),
              recorded_at: new Date().toISOString(),
            });
          }

          if (!previousSnapshot || !snapshotsEqual(previousSnapshot, snapshot)) {
            if (!previousSnapshot) {
              inserted += 1;
            } else {
              updated += 1;
            }

            // Track exactly what changed in refresh_changes
            if (runId) {
              const changesList = [];
              const fieldsToCompare: Array<{ key: keyof HistorySnapshot; label: string }> = [
                { key: "availableKw", label: "available_capacity" },
                { key: "capacity", label: "capacity" },
                { key: "allowedCap", label: "allowed_cap" },
                { key: "feasible", label: "feasible" },
                { key: "regi", label: "regi" },
                { key: "compCap", label: "comp_cap" },
              ];

              for (const field of fieldsToCompare) {
                const oldValue = previousSnapshot ? previousSnapshot[field.key] : 0;
                const newValue = snapshot[field.key];
                if (!previousSnapshot || oldValue !== newValue) {
                  changesList.push({
                    run_id: runId,
                    district_id: districtId || null,
                    section_code: officeCode,
                    transformer_id: t.kseb_transformer_id,
                    transformer_uuid: t.id,
                    field_name: field.label,
                    old_value: String(oldValue),
                    new_value: String(newValue),
                    section_name: sectionName,
                    district_name: districtId ? (DISTRICT_ID_TO_NAME[districtId] || null) : null,
                    transformer_name: t.transformer_name,
                  });
                }
              }

              if (changesList.length > 0) {
                try {
                  await supabaseRest("refresh_changes", {
                    method: "POST",
                    body: changesList,
                  });
                } catch (err) {
                  console.error("Failed to log refresh changes in bulk loop", err);
                }
              }
            }
          }
        }

        if (historyBodies.length > 0) {
          await supabaseRest("transformer_history", {
            method: "POST",
            body: historyBodies,
          });
        }
      }
    } catch (error) {
      if (!isDuplicateKeyError(error) && !isMissingConflictConstraintError(error)) throw error;
      // Fallback: run sequential upserts
      for (const row of deduplicatedRows) {
        const result = await refreshTransformer(row, officeCode, sectionName, runId, districtId);
        transformers += 1;
        if (result.updated) updated += 1;
        if (result.inserted) inserted += 1;
        if (result.historyRecorded) historyRecorded += 1;
      }
    }
  }

  return {
    transformers,
    inserted,
    updated,
    skipped,
    historyRecorded,
  };
}


