import type { Request, Response } from "express";
import { prisma } from "../db/prisma";

// GET /api/menu — categories in menu order, each with its available dishes.
export async function getMenu(_req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      dishes: {
        where: { isAvailable: true },
        orderBy: { name: "asc" },
      },
    },
  });

  res.json(categories);
}
