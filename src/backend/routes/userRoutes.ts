import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { hashPassword, verifyPassword, generateToken } from "../auth";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["operator", "admin"]).default("operator"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/user/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, role } = registerSchema.parse(req.body);

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    const password_hash = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1,$2,$3)
       RETURNING id, email, role, created_at`,
      [email, password_hash, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: "Invalid body", details: err.issues });
    }
    console.error("POST /api/user/register error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await pool.query(
      "SELECT id, email, password_hash, role FROM users WHERE email = $1",
      [email]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken({ id: user.id, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: "Invalid body", details: err.issues });
    }
    console.error("POST /api/user/login error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
