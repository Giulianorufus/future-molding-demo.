import { Router } from 'express';
import { authMiddleware } from '../auth';
import logger from '../logger';
const router = Router();

// Audit logging must be authenticated
router.post('/log', authMiddleware, (req, res) => {
  logger.info({ user: (req as any).user?.id ?? null, action: req.body.action, timestamp: new Date() });
  res.status(201).json({ ok: true });
});

export default router;
