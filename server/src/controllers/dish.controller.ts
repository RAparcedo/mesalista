import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { Prisma } from "../generated/prisma/client";
import { createDishSchema, updateDishSchema } from "../validation/dish.schema";

// GET /api/dishes — every category with ALL its dishes, hidden ones included.
// (The public /api/menu filters out unavailable dishes; the admin must see them.)
export async function listDishes(_req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    include: { dishes: { orderBy: { name: "asc" } } },
  });
  res.json(categories);
}

// POST /api/dishes — add a dish to an existing category.
export async function createDish(req: Request, res: Response) {
  const result = createDishSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: "Datos inválidos",
      fields: z.flattenError(result.error).fieldErrors,
    });
    return;
  }

  try {
    const dish = await prisma.dish.create({ data: result.data });
    res.status(201).json(dish);
  } catch (error) {
    // P2003: categoryId doesn't reference a real category.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      res.status(400).json({
        error: "Datos inválidos",
        fields: { categoryId: ["Esa categoría no existe"] },
      });
      return;
    }
    throw error;
  }
}

// PATCH /api/dishes/:id — edit fields and/or toggle availability.
export async function updateDish(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Id inválido" });
    return;
  }

  const result = updateDishSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: "Datos inválidos",
      fields: z.flattenError(result.error).fieldErrors,
    });
    return;
  }

  try {
    const dish = await prisma.dish.update({ where: { id }, data: result.data });
    res.json(dish);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Plato no encontrado" });
      return;
    }
    throw error;
  }
}

// DELETE /api/dishes/:id — remove a dish permanently.
// (To take a dish off the menu temporarily, PATCH isAvailable instead.)
export async function deleteDish(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Id inválido" });
    return;
  }

  try {
    await prisma.dish.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Plato no encontrado" });
      return;
    }
    throw error;
  }
}
