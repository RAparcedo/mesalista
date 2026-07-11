import { apiGet } from "./client";
import type { Category } from "../types";

export function getMenu(): Promise<Category[]> {
  return apiGet<Category[]>("/api/menu");
}
