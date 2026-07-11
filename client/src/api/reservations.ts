import { apiPost } from "./client";
import type { Reservation } from "../types";

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
