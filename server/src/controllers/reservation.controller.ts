import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { createReservationSchema } from "../validation/reservation.schema";

// POST /api/reservations — validate input and create a PENDING reservation.
// Table assignment / availability checks arrive with the availability logic.
export async function createReservation(req: Request, res: Response) {
  const result = createReservationSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: "Datos inválidos",
      fields: z.flattenError(result.error).fieldErrors,
    });
    return;
  }

  const input = result.data;

  const reservation = await prisma.reservation.create({
    data: {
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      // "2026-07-15" parses as UTC midnight; @db.Date keeps only the date part.
      date: new Date(input.date),
      time: input.time,
      partySize: input.partySize,
    },
  });

  res.status(201).json(reservation);
}
