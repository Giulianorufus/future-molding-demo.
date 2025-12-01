import { Router } from "express";
import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { analyzeDefectsLocal } from "../../lib/analyzeDefectsLocal";

dotenv.config();

const router = Router();

// Allow slightly larger bodies for AI analysis (images/geometry placeholders)
router.use(express.json({ limit: process.env.AI_BODY_LIMIT || "512kb" }));

// Per-route rate limiter as additional protection
const localAiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: Number(process.env.AI_RATE_LIMIT_MAX || 20) });
router.use(localAiLimiter);

const bodySchema = z.object({
  drawingName: z.string().optional(),
  material: z.any().optional(),
  press: z.any().optional(),
  geometry: z.any().optional(),
  injectionParams: z.any().optional(),
  defects: z.array(z.any()).optional(),
});

// Helper: remove obvious PII and truncate large blobs before sending to cloud
function sanitizeForAi(input: any) {
  const clone: any = Array.isArray(input) ? [] : {};

  function scrub(val: any, depth = 0) {
    if (depth > 3) return "[TRUNCATED]";
    if (val === null || val === undefined) return val;
    if (typeof val === "string") {
      // remove long base64/image blobs
      if (val.length > 1000) return val.slice(0, 500) + "...[truncated]";
      // redact emails
      if (/\S+@\S+\.\S+/.test(val)) return "[REDACTED_EMAIL]";
      return val;
    }
    if (typeof val === "number" || typeof val === "boolean") return val;
    if (Array.isArray(val)) return val.slice(0, 20).map((v) => scrub(v, depth + 1));
    if (typeof val === "object") {
      const out: any = {};
      for (const k of Object.keys(val)) {
        if (/password|token|secret|apiKey|authorization|email/i.test(k)) {
          out[k] = "[REDACTED]";
          continue;
        }
        out[k] = scrub(val[k], depth + 1);
      }
      return out;
    }
    return "[UNHANDLED]";
  }

  return scrub(input, 0);
}

// Simple analyze endpoint: uses cloud AI if API key present, otherwise local analyzer
router.post("/analyze", async (req, res) => {
  try {
    const data = bodySchema.parse(req.body);

    // If no cloud key, run local analysis
    if (!process.env.OPENAI_API_KEY) {
      const result = analyzeDefectsLocal(data);
      return res.json({ source: "local", result });
    }

    // Sanitize payload for prompt to avoid leaking secrets or huge blobs
    const sanitized = sanitizeForAi(data);
    let payloadStr = JSON.stringify(sanitized);
    const maxPromptLen = Number(process.env.AI_PROMPT_MAX_CHARS || 4000);
    if (payloadStr.length > maxPromptLen) {
      payloadStr = payloadStr.slice(0, maxPromptLen) + "... [TRUNCATED]";
    }

    const apiKey = process.env.OPENAI_API_KEY as string;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const prompt = `Analizza difetti plastici e proponi correzioni reali. Dati: ${payloadStr}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.1, max_tokens: 800 }),
    });

    const json: any = await response.json();
    const text = (json && (json.choices?.[0]?.message?.content)) || json?.error || "Nessuna risposta";
    return res.json({ source: "cloud", result: text });
  } catch (err: any) {
    console.warn("AI analyze failed, falling back to local:", err?.message || err);
    try {
      const data = req.body;
      const local = analyzeDefectsLocal(data);
      return res.json({ source: "local", result: local, error: String(err?.message ?? err) });
    } catch (e: any) {
      return res.status(500).json({ error: String(e?.message ?? e) });
    }
  }
});

export default router;
