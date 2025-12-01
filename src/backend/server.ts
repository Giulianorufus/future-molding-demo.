import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();

import pressRoutes from "./routes/pressRoutes";
import userRoutes from "./routes/userRoutes";
import aiRoutes from "./routes/aiRoutes";
import paramsRoutes from "./routes/paramsRoutes";
import calcAutoRoutes from "./routes/calcAutoRoutes";
import { authMiddleware } from "./auth";

const app = express();

// Global body size limit (keeps large payloads out by default)
app.use(express.json({ limit: "100kb" }));

// Security headers
app.use(helmet());

// Simple request logger with body redaction to avoid leaking secrets/PII in logs
app.use((req, _res, next) => {
  try {
    const safeBody = (() => {
      if (!req.body) return undefined;
      const clone = Array.isArray(req.body) ? [] : {};
      const keys = Object.keys(req.body || {});
      for (const k of keys) {
        try {
          if (/password|token|secret|apiKey|authorization|email/i.test(k)) {
            (clone as any)[k] = "[REDACTED]";
          } else {
            const v = req.body[k];
            if (typeof v === "string" && v.length > 300) (clone as any)[k] = v.slice(0, 200) + "...[TRUNC]";
            else (clone as any)[k] = v;
          }
        } catch (_) {
          (clone as any)[k] = "[UNLOGGABLE]";
        }
      }
      return clone;
    })();
    const authPresent = !!req.headers.authorization;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} auth=${authPresent} body=${JSON.stringify(safeBody)}`);
  } catch (_) {}
  next();
});

// CORS: allow list from env or default to localhost dev
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",").map((s) => s.trim());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Global Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || "150"),
});
app.use(limiter);

// Basic security headers
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// Per-route stricter limits (AI endpoint should be rate-limited separately)
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: Number(process.env.AI_RATE_LIMIT_MAX || "20") });

// Global guard: protect /api/* by default, whitelist login/register
app.use((req, res, next) => {
  try {
    if (!req.path.startsWith('/api')) return next();
    const publicPaths = ['/api/user/login', '/api/user/register'];
    if (publicPaths.includes(req.path)) return next();
    return authMiddleware(req, res, next);
  } catch (e) {
    return next();
  }
});

// Routes
app.use("/api/press", pressRoutes);
app.use("/api/user", userRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/params", paramsRoutes);
app.use("/api/calc", calcAutoRoutes);

// Start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // optional: verify calc engine integrity if expected hash provided
  (async () => {
    try {
      const expected = process.env.CALC_ENGINE_HASH;
      if (!expected) return;
      // lazy import
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { computeCalcEngineHash } = require('../engine/calcEngine');
      if (typeof computeCalcEngineHash === 'function') {
        const h = await computeCalcEngineHash();
        if (h && h !== expected) console.warn('CALC ENGINE HASH MISMATCH — possible tampering or build mismatch');
        else console.log('Calc engine integrity OK');
      }
    } catch (e) {
      console.warn('Failed to verify calc engine integrity', e && e.message);
    }
  })();
});
