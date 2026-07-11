import { apiGet, apiPatch } from "./client";

export interface Settings {
  timeSlots: string[];
  maxPartySize: number;
}

// Public — the reservation form builds its selects from this.
export function getSettings(): Promise<Settings> {
  return apiGet<Settings>("/api/settings");
}

// Admin — change opening hours / party size cap.
export function updateSettings(input: Settings): Promise<Settings> {
  return apiPatch<Settings>("/api/settings", input, true);
}
