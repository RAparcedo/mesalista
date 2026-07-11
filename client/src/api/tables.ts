import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { RestaurantTable } from "../types";

// All admin-only.

export interface TableInput {
  name: string;
  capacity: number;
}

export function listTables(): Promise<RestaurantTable[]> {
  return apiGet<RestaurantTable[]>("/api/tables", true);
}

export function createTable(input: TableInput): Promise<RestaurantTable> {
  return apiPost<RestaurantTable>("/api/tables", input, true);
}

export function updateTable(id: number, input: TableInput): Promise<RestaurantTable> {
  return apiPatch<RestaurantTable>(`/api/tables/${id}`, input, true);
}

export function deleteTable(id: number): Promise<void> {
  return apiDelete(`/api/tables/${id}`, true);
}
