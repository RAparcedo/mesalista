import { Router } from "express";
import { getMenu } from "../controllers/menu.controller";

export const menuRouter = Router();

menuRouter.get("/", getMenu);
