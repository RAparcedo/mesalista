import { Router } from "express";
import { createReservation } from "../controllers/reservation.controller";
import { listReservations, updateReservationStatus } from "../controllers/admin.controller";
import { requireAuth } from "../middleware/requireAuth";

export const reservationRouter = Router();

// Public: anyone can book.
reservationRouter.post("/", createReservation);

// Admin only: view and manage the day's reservations.
reservationRouter.get("/", requireAuth, listReservations);
reservationRouter.patch("/:id", requireAuth, updateReservationStatus);
