import { Router } from "express";
import { createDish, deleteDish, listDishes, updateDish } from "../controllers/dish.controller";
import { requireAuth } from "../middleware/requireAuth";

// The whole menu-management API is admin-only.
export const dishRouter = Router();

dishRouter.use(requireAuth);

dishRouter.get("/", listDishes);
dishRouter.post("/", createDish);
dishRouter.patch("/:id", updateDish);
dishRouter.delete("/:id", deleteDish);
