import "dotenv/config";
import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { authRouter } from "./routes/auth.routes";
import { menuRouter } from "./routes/menu.routes";
import { reservationRouter } from "./routes/reservation.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/menu", menuRouter);
app.use("/api/reservations", reservationRouter);

// Express 5 forwards rejected promises here automatically.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT) || 3001;

app.listen(port, () => {
  console.log(`MesaLista API listening on http://localhost:${port}`);
});
