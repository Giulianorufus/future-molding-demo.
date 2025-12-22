import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();

let pressRoutes: any = undefined;
let userRoutes: any = undefined;
let aiRoutes: any = undefined;
let paramsRoutes: any = undefined;
let calcAutoRoutes: any = undefined;
import { authMiddleware } from "./auth";

// Lazy-load route modules so tests can import `app` without transforming all deps (node-fetch ESM)
if (!process.env.DISABLE_BACKEND_ROUTES) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    pressRoutes = require('./routes/pressRoutes').default;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    userRoutes = require('./routes/userRoutes').default;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    aiRoutes = require('./routes/aiRoutes').default;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    paramsRoutes = require('./routes/paramsRoutes').default;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    calcAutoRoutes = require('./routes/calcAutoRoutes').default;
  } catch (e) {
    // in test environments some dependencies (ESM-only) may fail to load; skip registering those routes
  }
}
import { getTelemetry, averageParseMs } from "../lib/cadTelemetry";

export const app = express();

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
if (pressRoutes) app.use("/api/press", pressRoutes);
if (userRoutes) app.use("/api/user", userRoutes);
if (aiRoutes) app.use("/api/ai", aiLimiter, aiRoutes);
if (paramsRoutes) app.use("/api/params", paramsRoutes);
if (calcAutoRoutes) app.use("/api/calc", calcAutoRoutes);

// Dev-only telemetry endpoint for debug in non-production or when explicitly enabled
const devEnabled = process.env.NODE_ENV !== "production" || process.env.ENABLE_DEV_ENDPOINTS === "1";
if (devEnabled) {
  app.get("/dev/cad-telemetry", (_req, res) => {
    try {
      res.json({
        ...getTelemetry(),
        averageParseMs: averageParseMs(),
        ts: Date.now(),
      });
    } catch (e) {
      res.status(500).json({ error: 'failed to read telemetry' });
    }
  });
}

// Start (only when run directly)
const PORT = process.env.PORT || 4000;
if (typeof require !== 'undefined' && require.main === module) {
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
}
