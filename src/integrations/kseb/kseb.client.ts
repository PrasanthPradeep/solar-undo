/**
 * KSEB HTTP client — thin wrapper around fetch for all KSEB portal requests.
 * All other integration modules (captcha, quickpay, billview) use this client.
 * TODO: Add auth headers / session cookie handling when integrating real API.
 */

const KSEB_BASE_URL = process.env.KSEB_BASE_URL ?? "https://wss.kseb.in";

export async function ksebGet<T>(path: string): Promise<T> {
  const res = await fetch(`${KSEB_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`KSEB GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function ksebPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${KSEB_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`KSEB POST ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}
