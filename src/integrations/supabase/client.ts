import { env } from "@/config/env";

type SupabaseMethod = "GET" | "POST" | "PATCH";

export class SupabaseUnavailableError extends Error {
  constructor() {
    super("Supabase cache is not configured.");
    this.name = "SupabaseUnavailableError";
  }
}

function assertConfigured() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new SupabaseUnavailableError();
  }
}

export function isSupabaseConfigured() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function supabaseRest<T>(
  path: string,
  options: {
    method?: SupabaseMethod;
    body?: unknown;
    prefer?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  assertConfigured();

  const res = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(`Supabase request failed (${res.status}): ${message || res.statusText}`);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

export async function supabaseCount(path: string): Promise<number> {
  assertConfigured();

  const res = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`, {
    method: "HEAD",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "count=exact",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(`Supabase count failed (${res.status}): ${message || res.statusText}`);
  }

  const range = res.headers.get("content-range") ?? "";
  const match = range.match(/\/(\d+)$/);
  return match ? Number(match[1]) : 0;
}
