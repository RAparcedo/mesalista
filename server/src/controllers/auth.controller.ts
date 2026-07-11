import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db/prisma";

const loginSchema = z.object({
  email: z.email("Introduce un email válido"),
  password: z.string().min(1, "Introduce la contraseña"),
});

// POST /api/auth/login — checks credentials, returns a 12h JWT.
export async function login(req: Request, res: Response) {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: "Datos inválidos",
      fields: z.flattenError(result.error).fieldErrors,
    });
    return;
  }

  const { email, password } = result.data;
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  // Same 401 whether the email or the password is wrong — a different
  // answer would tell an attacker which emails exist.
  const passwordOk = admin && (await bcrypt.compare(password, admin.passwordHash));
  if (!passwordOk) {
    res.status(401).json({ error: "Email o contraseña incorrectos" });
    return;
  }

  const token = jwt.sign({ sub: admin.id, email: admin.email }, process.env.JWT_SECRET!, {
    expiresIn: "12h",
  });

  res.json({ token });
}
