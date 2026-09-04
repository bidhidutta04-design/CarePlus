import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config.js";
import { validate } from "../middleware.js";

const router = Router();

const ROLES = ["Admin", "Doctor", "Nurse", "Pharmacist", "LabTech", "Cashier"] as const;

const loginSchema = z.object({
  role: z.enum(ROLES),
  name: z.string().min(2).max(80),
});

// POST /api/auth/login — role-based workstation sign-in (mock IdP; replace with LDAP/SSO).
router.post("/login", validate(loginSchema), (req, res) => {
  const { role, name } = req.body as { role: string; name: string };
  const token = jwt.sign({ sub: `${role}-${Date.now()}`, name, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
  res.json({ data: { token, role, name } });
});

// GET /api/auth/roles
router.get("/roles", (_req, res) => {
  res.json({ data: ROLES });
});

export default router;
