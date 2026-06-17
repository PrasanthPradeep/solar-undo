const KSEB_BASE_URL = process.env.KSEB_BASE_URL ?? "https://wss.kseb.in";
const KSEB_OLD_BASE_URL = process.env.KSEB_OLD_BASE_URL ?? "https://old.kseb.in";

export interface KsebRequestOptions {
  baseUrl?: string;
  headers?: HeadersInit;
}

function buildUrl(pathOrUrl: string, baseUrl = KSEB_BASE_URL) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${baseUrl}${pathOrUrl}`;
}

export async function ksebGet<T>(path: string): Promise<T> {
  const res = await fetch(buildUrl(path), {
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

export async function ksebPostForm(path: string, form: Record<string, string>, options: KsebRequestOptions = {}) {
  const body = new URLSearchParams(form);
  const res = await fetch(buildUrl(path, options.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "solar-undo/1.0",
      ...options.headers,
    },
    body,
  });

  if (!res.ok) throw new Error(`KSEB POST ${path} failed: ${res.status}`);
  return res;
}

export async function ksebGetText(path: string, options: KsebRequestOptions = {}) {
  const res = await fetch(buildUrl(path, options.baseUrl), {
    headers: {
      "User-Agent": "solar-undo/1.0",
      ...options.headers,
    },
  });

  if (!res.ok) throw new Error(`KSEB GET ${path} failed: ${res.status}`);
  return res.text();
}

export async function ksebGetResponse(path: string, options: KsebRequestOptions = {}) {
  const res = await fetch(buildUrl(path, options.baseUrl), {
    headers: {
      "User-Agent": "solar-undo/1.0",
      ...options.headers,
    },
  });

  if (!res.ok) throw new Error(`KSEB GET ${path} failed: ${res.status}`);
  return res;
}

export async function ksebGetBuffer(path: string, options: KsebRequestOptions = {}) {
  const res = await ksebGetResponse(path, options);
  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") ?? "application/octet-stream",
  };
}

export async function ksebPostFormText(path: string, form: Record<string, string>, options: KsebRequestOptions = {}) {
  const res = await ksebPostForm(path, form, options);
  return res.text();
}

export async function ksebPostFormBuffer(path: string, form: Record<string, string>, options: KsebRequestOptions = {}) {
  const res = await ksebPostForm(path, form, options);
  return Buffer.from(await res.arrayBuffer());
}

export async function ksebPostFormBinary(path: string, form: Record<string, string>, options: KsebRequestOptions = {}) {
  const res = await ksebPostForm(path, form, options);
  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") ?? "application/octet-stream",
    contentDisposition: res.headers.get("content-disposition") ?? "",
  };
}

export { KSEB_BASE_URL, KSEB_OLD_BASE_URL };
