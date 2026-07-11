import { z } from "zod";

// Shape-level validation for POST /api/reservations. The rules that depend
// on the restaurant's settings (real time slots, party size cap) are checked
// in the controller against the database — they're data, not code.
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
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato de hora inválido (HH:MM)"),
  partySize: z
    .number()
    .int("El número de personas debe ser un entero")
    .min(1, "Mínimo 1 persona"),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
