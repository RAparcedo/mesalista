import type { PrismaClient } from "../src/generated/prisma/client";

// Generates ~350-450 reservations over the last 60 days (plus a handful of
// upcoming ones) with realistic patterns: busy weekends, lunch/dinner peaks,
// ~10% cancellations. Deterministic: same seed → same data, so demo charts
// and screenshots are reproducible.

// --- Tiny seeded PRNG (mulberry32). Math.random() can't be replayed. ---
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(2026);

// Weighted pick: entry [value, weight] — higher weight, more likely.
function pick<T>(entries: [T, number][]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

// --- The shape of a typical week and a typical day ---

// Multiplier per weekday (0=Sunday ... 6=Saturday): weekends busy, Mon/Tue dead.
const DAY_WEIGHT = [1.0, 0.5, 0.5, 0.7, 0.9, 1.5, 1.8];
const BASE_PER_DAY = 6; // average bookings on a "weight 1.0" day

// How demand spreads across slots: dinner beats lunch, 21:00 is king.
const SLOT_WEIGHTS: [string, number][] = [
  ["13:00", 0.8],
  ["13:30", 1.0],
  ["14:00", 1.2],
  ["14:30", 1.0],
  ["15:00", 0.5],
  ["20:00", 0.8],
  ["20:30", 1.2],
  ["21:00", 1.4],
  ["21:30", 1.0],
  ["22:00", 0.6],
];

// Couples dominate, then four-tops. Sums to 1 in spirit, weights in practice.
const PARTY_WEIGHTS: [number, number][] = [
  [1, 5],
  [2, 42],
  [3, 15],
  [4, 25],
  [5, 6],
  [6, 7],
];

const FIRST_NAMES = ["María", "Carmen", "Lucía", "Ana", "Laura", "Marta", "Paula", "Sara", "José", "Antonio", "Manuel", "Javier", "David", "Daniel", "Carlos", "Miguel", "Álvaro", "Pablo", "Sergio", "Jorge"];
const LAST_NAMES = ["García", "Martínez", "López", "Sánchez", "Pérez", "Gómez", "Fernández", "Ruiz", "Díaz", "Moreno", "Muñoz", "Álvarez", "Romero", "Navarro", "Torres", "Ortega", "Ramos", "Castro", "Vega", "Molina"];

function randomName(): string {
  return `${pick(FIRST_NAMES.map((n): [string, number] => [n, 1]))} ${pick(LAST_NAMES.map((n): [string, number] => [n, 1]))}`;
}

function randomPhone(): string {
  let phone = "6";
  for (let i = 0; i < 8; i++) phone += Math.floor(random() * 10);
  return phone;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function seedReservations(prisma: PrismaClient) {
  const tables = await prisma.table.findMany({ orderBy: { capacity: "asc" } });

  type Row = {
    date: Date;
    time: string;
    partySize: number;
    customerName: string;
    customerPhone: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED";
    tableId: number;
    createdAt: Date;
  };
  const rows: Row[] = [];

  const today = new Date(new Date().toLocaleDateString("sv-SE"));

  // 60 days of history, plus the next 5 days so the Reservas tab has
  // something upcoming to manage.
  for (let offset = -60; offset <= 5; offset++) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() + offset);
    const isPast = offset < 0;

    // How many bookings this day *tries* to get: weekday shape × ±30% noise.
    // Future days get fewer — most of those bookings "haven't happened yet".
    const weight = DAY_WEIGHT[day.getUTCDay()];
    const noise = 0.7 + random() * 0.6;
    let target = Math.round(BASE_PER_DAY * weight * noise);
    if (!isPast) target = Math.ceil(target / 2);

    // Availability invariant, same as the real booking logic: per slot,
    // a table holds ONE active reservation. Cancelled ones don't block.
    const takenBySlot = new Map<string, Set<number>>();

    for (let i = 0; i < target; i++) {
      const time = pick(SLOT_WEIGHTS);
      const partySize = pick(PARTY_WEIGHTS);

      const taken = takenBySlot.get(time) ?? new Set<number>();
      const cancelled = random() < 0.1; // ~10% of bookings get cancelled

      // Smallest free table that fits — mirrors bookTable().
      const table = tables.find((t) => t.capacity >= partySize && !taken.has(t.id));
      if (!table) continue; // slot genuinely full — drop, like a real 409

      if (!cancelled) {
        taken.add(table.id);
        takenBySlot.set(time, taken);
      }

      // Past bookings that weren't cancelled happened → CONFIRMED.
      // Upcoming ones are a mix the admin still has to confirm.
      const status = cancelled ? "CANCELLED" : isPast ? "CONFIRMED" : random() < 0.5 ? "PENDING" : "CONFIRMED";

      // Booked between 0 and 14 days before the reservation date.
      const createdAt = new Date(day);
      createdAt.setUTCDate(createdAt.getUTCDate() - Math.floor(random() * 15));
      createdAt.setUTCHours(10 + Math.floor(random() * 12), Math.floor(random() * 60), 0, 0);

      rows.push({
        date: new Date(toDateString(day)),
        time,
        partySize,
        customerName: randomName(),
        customerPhone: randomPhone(),
        status,
        tableId: table.id,
        createdAt,
      });
    }
  }

  await prisma.reservation.createMany({ data: rows });
  return rows.length;
}
