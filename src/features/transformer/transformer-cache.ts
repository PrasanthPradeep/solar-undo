import { calculateSolarEligibility } from "@/features/solar/solar-calculator";
import { SolarAvailabilityResponse } from "@/integrations/kseb/solar-availability";
import { normalizeTransformerName, ResTransformerCapacity } from "@/integrations/kseb/res-capacity";
import { supabaseRest, SupabaseUnavailableError } from "@/integrations/supabase/client";

export interface CapacityTrendPoint {
  date: string;
  availableKw: number;
}

export interface CapacityChange {
  deltaKw: number;
  previousKw: number;
  currentKw: number;
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
  last_updated: string;
}

interface ConsumerTransformerRow {
  consumer_no: string;
  transformer_name: string;
  transformer_id: string | null;
  section_code: string;
  updated_at: string;
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

async function getHistory(transformerId: string): Promise<HistoryRow[]> {
  return supabaseRest<HistoryRow[]>(
    `transformer_history?transformer_id=eq.${encodeURIComponent(transformerId)}` +
      "&select=available_kw,recorded_at&order=recorded_at.desc&limit=7"
  );
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
    const transformerRows = await upsertTransformer({
      transformerName: data.transformerName,
      feederName: data.feederName,
      dtrCapacity: data.dtrCapacity,
      dtr90Capacity: data.dtr90Capacity,
      feasibilityIssued: data.feasibilityIssued,
      registrations: data.registrations,
      gridConnected: data.gridConnected,
      balanceAvailable: data.balanceAvailable,
    }, data.officeCode, data.sectionName);

    const transformer = transformerRows[0];
    if (!transformer) return;

    await upsertHistory(transformer.id, data.balanceAvailable);
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

    // Fallback: composite unique constraint missing or transformer_name-only constraint fired.
    // Find the existing row by (section_code, transformer_name) and PATCH it.
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

export async function upsertHistory(transformerId: string, availableKw: number) {
  const recordedDate = todayIsoDate();
  const body = {
    transformer_id: transformerId,
    available_kw: availableKw,
    recorded_date: recordedDate,
    recorded_at: new Date().toISOString(),
  };

  try {
    await supabaseRest("transformer_history?on_conflict=transformer_id,recorded_date", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: [body],
    });
  } catch (error) {
    if (!isMissingConflictConstraintError(error)) throw error;

    const existing = await supabaseRest<Array<{ id: string }>>(
      `transformer_history?transformer_id=eq.${encodeURIComponent(transformerId)}` +
        `&recorded_date=eq.${encodeURIComponent(recordedDate)}` +
        "&select=id&limit=1"
    );

    if (existing[0]) {
      await supabaseRest(`transformer_history?id=eq.${existing[0].id}`, {
        method: "PATCH",
        body,
      });
      return;
    }

    await supabaseRest("transformer_history", {
      method: "POST",
      body: [body],
    });
  }
}
