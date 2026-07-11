// Small fetch wrapper: base URL, JSON handling, and typed errors.

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

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new ApiError(res.status, `La petición falló (${res.status})`);
  }
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `La petición falló (${res.status})`, data?.fields);
  }
  return data;
}
