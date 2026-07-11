// Shapes returned by the API. Kept in sync with the Prisma models by hand —
// client and server are independent packages, so there is no shared types package.

export interface Dish {
  id: number;
  name: string;
  description: string;
  price: string; // Prisma Decimal arrives as a string, e.g. "8.5"
  isAvailable: boolean;
  categoryId: number;
}

export interface Category {
  id: number;
  name: string;
  displayOrder: number;
  dishes: Dish[];
}

export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface Reservation {
  id: number;
  date: string; // ISO date
  time: string; // "20:30"
  partySize: number;
  customerName: string;
  customerPhone: string;
  status: ReservationStatus;
  tableId: number | null;
  createdAt: string;
}
