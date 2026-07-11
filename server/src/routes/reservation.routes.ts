import { Router } from "express";
import { createReservation } from "../controllers/reservation.controller";

export const reservationRouter = Router();

reservationRouter.post("/", createReservation);
