import { apiGet, apiPatch, apiPost } from "./client";
import type { Reservation, ReservationStatus } from "../types";

export interface NewReservation {
  customerName: string;
  customerPhone: string;
  date: string; // "2026-07-20"
  time: string; // "20:30"
  partySize: number;
}

export function createReservation(input: NewReservation): Promise<Reservation> {
  return apiPost<Reservation>("/api/reservations", input);
}

// --- Admin (require login) ---

export function listReservations(date: string): Promise<Reservation[]> {
  return apiGet<Reservation[]>(`/api/reservations?date=${date}`, true);
}

export function updateReservationStatus(
  id: number,
  status: Extract<ReservationStatus, "CONFIRMED" | "CANCELLED">,
): Promise<Reservation> {
  return apiPatch<Reservation>(`/api/reservations/${id}`, { status }, true);
}
