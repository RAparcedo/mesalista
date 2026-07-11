import { Router } from "express";
import { createTable, deleteTable, listTables, updateTable } from "../controllers/table.controller";
import { requireAuth } from "../middleware/requireAuth";

// Floor-plan management is admin-only.
export const tableRouter = Router();

tableRouter.use(requireAuth);

tableRouter.get("/", listTables);
tableRouter.post("/", createTable);
tableRouter.patch("/:id", updateTable);
tableRouter.delete("/:id", deleteTable);
