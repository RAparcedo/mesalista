import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { getSettings } from "../services/settings";

const timeSlot = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)");

const updateSettingsSchema = z.object({
  timeSlots: z
    .array(timeSlot)
    .min(1, "Añade al menos un horario")
    .max(48, "Demasiados horarios"),
  maxPartySize: z
    .number()
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1")
    .max(20, "Máximo 20"),
});

// GET /api/settings — public: the reservation form needs the slots.
export async function readSettings(_req: Request, res: Response) {
  const settings = await getSettings();
  res.json({ timeSlots: settings.timeSlots, maxPartySize: settings.maxPartySize });
}

// PATCH /api/settings — admin only: change opening hours / party size cap.
export async function updateSettings(req: Request, res: Response) {
  const result = updateSettingsSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: "Datos inválidos",
      fields: z.flattenError(result.error).fieldErrors,
    });
    return;
  }

  // Dedupe and sort — "HH:MM" strings sort chronologically.
  const timeSlots = [...new Set(result.data.timeSlots)].sort();
  const data = { timeSlots, maxPartySize: result.data.maxPartySize };

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  res.json({ timeSlots: settings.timeSlots, maxPartySize: settings.maxPartySize });
}
