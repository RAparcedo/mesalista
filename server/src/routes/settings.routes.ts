import { Router } from "express";
import { readSettings, updateSettings } from "../controllers/settings.controller";
import { requireAuth } from "../middleware/requireAuth";

export const settingsRouter = Router();

// Public: the reservation form reads the bookable slots from here.
settingsRouter.get("/", readSettings);

// Admin: change opening hours and the party size cap.
settingsRouter.patch("/", requireAuth, updateSettings);
