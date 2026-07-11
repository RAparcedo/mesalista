import { z } from "zod";
import { MAX_PARTY_SIZE, TIME_SLOTS } from "../config/slots";

// Validates the body of POST /api/reservations.
// Anything that fails here never reaches the database.
export const createReservationSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  customerPhone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{6,20}$/, "Introduce un teléfono válido"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (AAAA-MM-DD)")
    .refine((value) => {
      // Compare dates as strings (YYYY-MM-DD sorts chronologically) to
      // avoid timezone surprises. "Today" is the server's local date.
      const today = new Date().toLocaleDateString("sv-SE"); // sv-SE = YYYY-MM-DD
      return value >= today;
    }, "La fecha no puede ser en el pasado"),
  time: z.enum(TIME_SLOTS, "Elige un horario disponible"),
  partySize: z
    .number()
    .int("El número de personas debe ser un entero")
    .min(1, "Mínimo 1 persona")
    .max(MAX_PARTY_SIZE, `Máximo ${MAX_PARTY_SIZE} personas — para grupos grandes, llámanos`),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
