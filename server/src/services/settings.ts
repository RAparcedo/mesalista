import { prisma } from "../db/prisma";

// Fallback if the settings row hasn't been created yet (fresh database
// before seeding) — same values the seed installs.
const DEFAULTS = {
  timeSlots: ["13:00", "13:30", "14:00", "14:30", "15:00", "20:00", "20:30", "21:00", "21:30", "22:00"],
  maxPartySize: 6,
};

export async function getSettings() {
  const row = await prisma.settings.findUnique({ where: { id: 1 } });
  return row ?? { id: 1, ...DEFAULTS };
}
