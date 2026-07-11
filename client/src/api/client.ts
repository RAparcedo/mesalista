// Small fetch wrapper: base URL, JSON handling, auth header and typed errors.

import { getToken } from "../lib/auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// Carries the HTTP status and, for 400s, the per-field validation
// messages the server produced ({ customerName: ["..."], ... }).
export class ApiError extends Error {
  status: number;
  fields?: Record<string, string[]>;

  constructor(status: number, message: string, fields?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

function buildHeaders(auth: boolean): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `La petición falló (${res.status})`, data?.fields);
  }
  return data;
}

export function apiGet<T>(path: string, auth = false): Promise<T> {
  return request<T>(path, { headers: buildHeaders(auth) });
}

export function apiPost<T>(path: string, body: unknown, auth = false): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: buildHeaders(auth),
    body: JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body: unknown, auth = false): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    headers: buildHeaders(auth),
    body: JSON.stringify(body),
  });
}
