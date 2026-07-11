import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";

// Every stats endpoint takes ?from=YYYY-MM-DD&to=YYYY-MM-DD.
// Defaults to the last 30 days (today included).

const rangeSchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .refine((r) => !r.from || !r.to || r.from <= r.to, {
    error: "'from' debe ser anterior a 'to'",
  });

function defaultRange(): { from: string; to: string } {
  const to = new Date().toLocaleDateString("sv-SE");
  const fromDate = new Date(to);
  fromDate.setUTCDate(fromDate.getUTCDate() - 29);
  return { from: fromDate.toISOString().slice(0, 10), to };
}

// Parses and validates the range, or answers 400 and returns null.
function parseRange(req: Request, res: Response): { from: string; to: string } | null {
  const result = rangeSchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: "Rango de fechas inválido (AAAA-MM-DD)" });
    return null;
  }
  const range = { ...defaultRange(), ...result.data };

  // A year is plenty for any chart; also caps the zero-fill work below.
  const days = (Date.parse(range.to) - Date.parse(range.from)) / 86_400_000 + 1;
  if (days > 366) {
    res.status(400).json({ error: "El rango máximo es de un año" });
    return null;
  }
  return range;
}

// Prisma filter shared by all three endpoints.
function inRange(range: { from: string; to: string }) {
  return { date: { gte: new Date(range.from), lte: new Date(range.to) } };
}

// GET /api/stats/summary — headline numbers for the range.
export async function summary(req: Request, res: Response) {
  const range = parseRange(req, res);
  if (!range) return;

  // ONE query: group the range's reservations by status and let Postgres
  // count rows and sum/average party sizes per status. We get back at most
  // 3 rows (PENDING/CONFIRMED/CANCELLED) — combining those is arithmetic,
  // not aggregation.
  const byStatus = await prisma.reservation.groupBy({
    by: ["status"],
    where: inRange(range),
    _count: { _all: true },
    _sum: { partySize: true },
    _avg: { partySize: true },
  });

  const total = byStatus.reduce((sum, row) => sum + row._count._all, 0);
  const cancelledRow = byStatus.find((row) => row.status === "CANCELLED");
  const cancelled = cancelledRow?._count._all ?? 0;

  // Covers and average party size only count bookings that (will) happen —
  // cancelled guests never sat down.
  const active = byStatus.filter((row) => row.status !== "CANCELLED");
  const covers = active.reduce((sum, row) => sum + (row._sum.partySize ?? 0), 0);
  const activeCount = total - cancelled;
  const avgPartySize = activeCount > 0 ? covers / activeCount : 0;

  res.json({
    from: range.from,
    to: range.to,
    total,
    cancelled,
    cancellationRate: total > 0 ? cancelled / total : 0,
    covers,
    avgPartySize: Number(avgPartySize.toFixed(2)),
  });
}

// GET /api/stats/daily — reservations + covers per day (time-series chart).
export async function daily(req: Request, res: Response) {
  const range = parseRange(req, res);
  if (!range) return;

  // Postgres groups by day and aggregates; rows arrive pre-sorted.
  const rows = await prisma.reservation.groupBy({
    by: ["date"],
    where: { ...inRange(range), status: { not: "CANCELLED" } },
    _count: { _all: true },
    _sum: { partySize: true },
    orderBy: { date: "asc" },
  });

  // groupBy only returns days that HAVE reservations. A chart needs the
  // quiet days too, so we zero-fill the gaps. This is presentation shaping
  // (bounded by the 366-day cap), not aggregation — that already happened
  // in the database.
  const byDay = new Map(
    rows.map((row) => [
      row.date.toISOString().slice(0, 10),
      { reservations: row._count._all, covers: row._sum.partySize ?? 0 },
    ]),
  );

  const days: { date: string; reservations: number; covers: number }[] = [];
  const cursor = new Date(range.from);
  const end = new Date(range.to);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    days.push({ date: key, ...(byDay.get(key) ?? { reservations: 0, covers: 0 }) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  res.json(days);
}

// GET /api/stats/hours — bookings per time slot (busiest hours chart).
export async function hours(req: Request, res: Response) {
  const range = parseRange(req, res);
  if (!range) return;

  // Same shape as daily, grouped by the slot string instead. "HH:MM" sorts
  // chronologically, so orderBy time gives the slots in day order.
  const rows = await prisma.reservation.groupBy({
    by: ["time"],
    where: { ...inRange(range), status: { not: "CANCELLED" } },
    _count: { _all: true },
    _sum: { partySize: true },
    orderBy: { time: "asc" },
  });

  res.json(
    rows.map((row) => ({
      time: row.time,
      reservations: row._count._all,
      covers: row._sum.partySize ?? 0,
    })),
  );
}
