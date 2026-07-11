import { prisma } from "../db/prisma";
import type { Reservation } from "../generated/prisma/client";

// Books the smallest free table that fits the party, or returns null if the
// slot is full. Check + insert run in ONE Serializable transaction: if two
// requests race for the last table, Postgres aborts one (P2034) instead of
// double-booking — the caller retries it against the new state.
export async function bookTable(input: {
  customerName: string;
  customerPhone: string;
  date: string; // "2026-07-20"
  time: string; // "20:30"
  partySize: number;
}): Promise<Reservation | null> {
  return prisma.$transaction(
    async (tx) => {
      // Tables big enough for the party, smallest first so a couple
      // doesn't take the 6-seater.
      const candidates = await tx.table.findMany({
        where: { capacity: { gte: input.partySize } },
        orderBy: { capacity: "asc" },
      });

      // Tables already taken in this slot. Cancelled bookings don't count.
      const taken = await tx.reservation.findMany({
        where: {
          date: new Date(input.date),
          time: input.time,
          status: { not: "CANCELLED" },
          tableId: { not: null },
        },
        select: { tableId: true },
      });
      const takenIds = new Set(taken.map((r) => r.tableId));

      const freeTable = candidates.find((table) => !takenIds.has(table.id));
      if (!freeTable) {
        return null; // slot is full for this party size
      }

      return tx.reservation.create({
        data: {
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          date: new Date(input.date),
          time: input.time,
          partySize: input.partySize,
          tableId: freeTable.id,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}
