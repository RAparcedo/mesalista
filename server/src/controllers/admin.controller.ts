import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { Prisma } from "../generated/prisma/client";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (AAAA-MM-DD)");

const updateStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED"], "Estado inválido"),
});

// GET /api/reservations?date=2026-07-20 — a day's reservations (default today).
export async function listReservations(req: Request, res: Response) {
  const raw = req.query.date ?? new Date().toLocaleDateString("sv-SE");
  const result = dateSchema.safeParse(raw);

  if (!result.success) {
    res.status(400).json({ error: "Datos inválidos", fields: { date: ["Formato de fecha inválido"] } });
    return;
  }

  const reservations = await prisma.reservation.findMany({
    where: { date: new Date(result.data) },
    include: { table: true },
    orderBy: [{ time: "asc" }, { createdAt: "asc" }],
  });

  res.json(reservations);
}

// PATCH /api/reservations/:id — confirm or cancel a reservation.
export async function updateReservationStatus(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Id inválido" });
    return;
  }

  const result = updateStatusSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: "Datos inválidos",
      fields: z.flattenError(result.error).fieldErrors,
    });
    return;
  }

  try {
    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: result.data.status },
      include: { table: true },
    });
    res.json(reservation);
  } catch (error) {
    // P2025: no row with that id.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Reserva no encontrada" });
      return;
    }
    throw error;
  }
}
