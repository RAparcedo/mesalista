import { z } from "zod";

// Validates POST /api/dishes.
export const createDishSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  description: z
    .string()
    .trim()
    .min(2, "Añade una descripción breve")
    .max(300, "La descripción es demasiado larga"),
  price: z
    .number("El precio debe ser un número")
    .positive("El precio debe ser mayor que 0")
    .max(999, "Precio fuera de rango"),
  categoryId: z.number().int("Elige una categoría"),
});

// PATCH /api/dishes/:id — any subset of fields, plus availability.
export const updateDishSchema = createDishSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});
