import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

// Guards admin endpoints: expects "Authorization: Bearer <token>".
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    // Invalid signature or expired token — same answer either way.
    res.status(401).json({ error: "Sesión caducada, vuelve a iniciar sesión" });
  }
}
