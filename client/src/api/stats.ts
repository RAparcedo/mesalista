import { apiGet } from "./client";

// All admin-only. `from`/`to` are YYYY-MM-DD.

export interface DateRange {
  from: string;
  to: string;
}

export interface StatsSummary {
  from: string;
  to: string;
  total: number;
  cancelled: number;
  cancellationRate: number; // 0..1
  covers: number;
  avgPartySize: number;
}

export interface DailyPoint {
  date: string; // "2026-07-01"
  reservations: number;
  covers: number;
}

export interface HourPoint {
  time: string; // "20:30"
  reservations: number;
  covers: number;
}

function query(range: DateRange): string {
  return `?from=${range.from}&to=${range.to}`;
}

export function getSummary(range: DateRange): Promise<StatsSummary> {
  return apiGet<StatsSummary>(`/api/stats/summary${query(range)}`, true);
}

export function getDaily(range: DateRange): Promise<DailyPoint[]> {
  return apiGet<DailyPoint[]>(`/api/stats/daily${query(range)}`, true);
}

export function getHours(range: DateRange): Promise<HourPoint[]> {
  return apiGet<HourPoint[]>(`/api/stats/hours${query(range)}`, true);
}

export interface OccupancyPoint {
  date: string;
  booked: number; // table-slots taken
  capacity: number; // tables × slots
  occupancy: number; // 0..1
}

export function getOccupancy(range: DateRange): Promise<OccupancyPoint[]> {
  return apiGet<OccupancyPoint[]>(`/api/stats/occupancy${query(range)}`, true);
}
