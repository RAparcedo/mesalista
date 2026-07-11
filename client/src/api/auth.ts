import { apiPost } from "./client";

export async function login(email: string, password: string): Promise<string> {
  const data = await apiPost<{ token: string }>("/api/auth/login", { email, password });
  return data.token;
}
