
import { Router } from "express";
import { z } from "zod";
import { adjustParametersLocal } from "@/lib/adjustParametersLocal";
import { authMiddleware } from "../auth";

const router = Router();

const injectionParamsSchema = z.object({
  material: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    density_g_cm3: z.number().optional(),
  }).nullable().optional(),
  press: z.object({ id: z.string().optional(), brand: z.string().optional(), model: z.string().optional() }).nullable().optional(),
  screwDiameter: z.number().optional(),
  projAreaCm2: z.number().optional(),
  volumeCm3: z.number().optional(),
}).optional();

const bodySchema = z.object({
  injectionParams: injectionParamsSchema,
  defects: z.array(z.any()).optional(),
});

router.post("/auto-params", authMiddleware, (req, res) => {
  try {
    const data = bodySchema.parse(req.body);
    const out = adjustParametersLocal(data);

    return res.json({
      source: "local",
      params: out,
    });

  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
