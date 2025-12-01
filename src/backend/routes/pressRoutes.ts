import { Router } from "express";
import { authMiddleware } from "../auth";
import { z } from "zod";
import { pool } from "../db";

const router = Router();

// Schema validazione pressa (rigoroso)
const pressSchema = z.object({
  id: z.string().min(1).optional(),
  brand: z.string().min(1),
  model: z.string().min(1),
  screw_diameter_mm: z.number().int().positive(),
  max_shot_cm3: z.number().positive().max(2000),
  max_inj_cm3_s: z.number().positive().max(2000),
  clamp_kN: z.number().positive().max(20000),
});

// GET tutte le presse
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, brand, model, screw_diameter_mm, max_shot_cm3, max_inj_cm3_s, clamp_kN FROM press ORDER BY brand, model"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/press error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET singola pressa
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const result = await pool.query(
      "SELECT id, brand, model, screw_diameter_mm, max_shot_cm3, max_inj_cm3_s, clamp_kN FROM press WHERE id = $1",
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/press/:id error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST nuova pressa
router.post("/", authMiddleware, async (req, res) => {
  try {
    const parsed = pressSchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO press (brand, model, screw_diameter_mm, max_shot_cm3, max_inj_cm3_s, clamp_kN)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, brand, model, screw_diameter_mm, max_shot_cm3, max_inj_cm3_s, clamp_kN`,
      [
        parsed.brand,
        parsed.model,
        parsed.screw_diameter_mm,
        parsed.max_shot_cm3,
        parsed.max_inj_cm3_s,
        parsed.clamp_kN,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: "Invalid body", details: err.issues });
    }
    console.error("POST /api/press error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update pressa
router.put("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const parsed = pressSchema.parse(req.body);
    const result = await pool.query(
      `UPDATE press
       SET brand = $1,
           model = $2,
           screw_diameter_mm = $3,
           max_shot_cm3 = $4,
           max_inj_cm3_s = $5,
           clamp_kN = $6
       WHERE id = $7
       RETURNING id, brand, model, screw_diameter_mm, max_shot_cm3, max_inj_cm3_s, clamp_kN`,
      [
        parsed.brand,
        parsed.model,
        parsed.screw_diameter_mm,
        parsed.max_shot_cm3,
        parsed.max_inj_cm3_s,
        parsed.clamp_kN,
        id,
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: "Invalid body", details: err.issues });
    }
    console.error("PUT /api/press/:id error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE pressa
router.delete("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const result = await pool.query("DELETE FROM press WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/press/:id error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
