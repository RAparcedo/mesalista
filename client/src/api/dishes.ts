import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { Category, Dish } from "../types";

// All of these are admin-only — the token travels on every call.

export interface DishInput {
  name: string;
  description: string;
  price: number;
  categoryId: number;
}

// Every category with ALL dishes, hidden ones included.
export function listDishes(): Promise<Category[]> {
  return apiGet<Category[]>("/api/dishes", true);
}

export function createDish(input: DishInput): Promise<Dish> {
  return apiPost<Dish>("/api/dishes", input, true);
}

export function updateDish(
  id: number,
  input: Partial<DishInput> & { isAvailable?: boolean },
): Promise<Dish> {
  return apiPatch<Dish>(`/api/dishes/${id}`, input, true);
}

export function deleteDish(id: number): Promise<void> {
  return apiDelete(`/api/dishes/${id}`, true);
}
