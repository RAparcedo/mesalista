// The restaurant's bookable time slots. Availability logic (Day 5-6)
// and reservation validation both use this single source of truth.
export const TIME_SLOTS = [
  // Lunch service
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  // Dinner service
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
] as const;

// Largest table seats 6 — bigger parties can't be seated (yet).
export const MAX_PARTY_SIZE = 6;
