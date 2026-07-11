import type { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "../generated/prisma/client";
import { bookTable } from "../services/availability";
import { createReservationSchema } from "../validation/reservation.schema";

function isWriteConflict(error: unknown): boolean {
  // P2034: the Serializable transaction was aborted by a concurrent one.
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

// POST /api/reservations — validate, then assign the smallest free table
// for the slot. 400 = bad input, 409 = slot full.
export async function createReservation(req: Request, res: Response) {
  const result = createReservationSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: "Datos inválidos",
      fields: z.flattenError(result.error).fieldErrors,
    });
    return;
  }

  let reservation;
  try {
    reservation = await bookTable(result.data);
  } catch (error) {
    if (!isWriteConflict(error)) throw error;
    // Someone booked at the same instant — retry once against the new state.
    reservation = await bookTable(result.data);
  }

  if (!reservation) {
    res.status(409).json({
      error: "Sin disponibilidad",
      fields: {
        time: [
          `No queda mesa para ${result.data.partySize} el día elegido a las ${result.data.time}. Prueba otro horario.`,
        ],
      },
    });
    return;
  }

  res.status(201).json(reservation);
}
