import { Router } from "express";
import { daily, hours, summary } from "../controllers/stats.controller";
import { requireAuth } from "../middleware/requireAuth";

// Business analytics — owner's eyes only.
export const statsRouter = Router();

statsRouter.use(requireAuth);

statsRouter.get("/summary", summary);
statsRouter.get("/daily", daily);
statsRouter.get("/hours", hours);
