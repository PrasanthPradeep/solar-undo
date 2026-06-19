import { calculateSolarEligibility } from "@/features/solar/solar-calculator";
import { SolarAvailabilityResponse } from "@/integrations/kseb/solar-availability";
import { normalizeTransformerName, ResTransformerCapacity } from "@/integrations/kseb/res-capacity";
import { getOfficeList } from "@/integrations/kseb/office-map";
import { supabaseCount, supabaseRest, SupabaseUnavailableError } from "@/integrations/supabase/client";

/** Returns the distinct section_codes of all transformers already cached in the DB. */
export async function getKnownSectionCodes(): Promise<string[]> {
  const rows = await supabaseRest<Array<{ section_code: string }>>(
    "transformers?select=section_code&order=section_code"
  );
  const unique = [...new Set(rows.map((r) => r.section_code))];
  return unique;
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

    const fullMapping = {
      consumer_no: data.consumerNumber,
      transformer_name: data.transformerName,
      transformer_id: transformer.id,
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
  const ksebTransformerId = `${sectionCode}:${transformerName}`;
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

    const existing = await supabaseRest<TransformerRow[]>(
      `transformers?section_code=eq.${encodeURIComponent(sectionCode)}` +
        `&transformer_name=eq.${encodeURIComponent(transformerName)}` +
        "&select=*&limit=1"
    );

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
  sectionName: string
) {
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

  return {
    updated: !previousSnapshot || !snapshotsEqual(previousSnapshot, snapshot),
    historyRecorded,
  };
}
