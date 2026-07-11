import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { Prisma } from "../generated/prisma/client";

const tableSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ponle un nombre a la mesa")
    .max(50, "El nombre es demasiado largo"),
  capacity: z
    .number("La capacidad debe ser un número")
    .int("La capacidad debe ser un número entero")
    .min(1, "Mínimo 1 persona")
    .max(20, "Máximo 20 personas"),
});

function parseId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Id inválido" });
    return null;
  }
  return id;
}

// GET /api/tables — the floor plan, smallest tables first.
export async function listTables(_req: Request, res: Response) {
  const tables = await prisma.table.findMany({
    orderBy: [{ capacity: "asc" }, { name: "asc" }],
  });
  res.json(tables);
}

// POST /api/tables — add a table.
export async function createTable(req: Request, res: Response) {
  const result = tableSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: "Datos inválidos",
      fields: z.flattenError(result.error).fieldErrors,
    });
    return;
  }

  try {
    const table = await prisma.table.create({ data: result.data });
    res.status(201).json(table);
  } catch (error) {
    // P2002: unique constraint — a table with that name already exists.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(400).json({
        error: "Datos inválidos",
        fields: { name: ["Ya existe una mesa con ese nombre"] },
      });
      return;
    }
    throw error;
  }
}

// PATCH /api/tables/:id — rename or change capacity.
export async function updateTable(req: Request, res: Response) {
  const id = parseId(req, res);
  if (id === null) return;

  const result = tableSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: "Datos inválidos",
      fields: z.flattenError(result.error).fieldErrors,
    });
    return;
  }

  try {
    const table = await prisma.table.update({ where: { id }, data: result.data });
    res.json(table);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Mesa no encontrada" });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(400).json({
        error: "Datos inválidos",
        fields: { name: ["Ya existe una mesa con ese nombre"] },
      });
      return;
    }
    throw error;
  }
}

// DELETE /api/tables/:id — only if the table has no upcoming reservations.
// Deleting a booked table would silently free its slots and cause
// overbooking; the owner must move or cancel those reservations first.
export async function deleteTable(req: Request, res: Response) {
  const id = parseId(req, res);
  if (id === null) return;

  const today = new Date(new Date().toLocaleDateString("sv-SE"));
  const upcoming = await prisma.reservation.count({
    where: { tableId: id, status: { not: "CANCELLED" }, date: { gte: today } },
  });

  if (upcoming > 0) {
    res.status(409).json({
      error: `Esta mesa tiene ${upcoming} reserva(s) próximas. Cancélalas antes de borrarla.`,
    });
    return;
  }

  try {
    await prisma.table.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Mesa no encontrada" });
      return;
    }
    throw error;
  }
}
