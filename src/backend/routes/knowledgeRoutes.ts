import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../auth'
import type { KnowledgeService } from '../services/knowledgeService'
import { knowledgeCaseSchema } from '@/engine/knowledge/knowledgeCase.schema'
import { knowledgeOutcomeSchema } from '@/engine/knowledge/knowledgeOutcome.schema'
import { knowledgeExperimentSchema } from '@/engine/knowledge/knowledgeExperiment.schema'

const createSimilarCaseQuerySchema = z.object({
  recipeFingerprint: z.string().optional(),
  pressId: z.string().optional(),
  materialId: z.string().optional(),
  defectId: z.string().optional(),
  severity: z.string().optional(),
}).strict()

const createStatisticsQuerySchema = z.object({
  recipeFingerprint: z.string().optional(),
  pressId: z.string().optional(),
  materialId: z.string().optional(),
  fromISO: z.string().optional().refine((value) => value == null || !Number.isNaN(Date.parse(value)), {
    message: 'Invalid ISO timestamp',
  }),
  toISO: z.string().optional().refine((value) => value == null || !Number.isNaN(Date.parse(value)), {
    message: 'Invalid ISO timestamp',
  }),
}).strict()

export function createKnowledgeRoutes(service: KnowledgeService) {
  const router = Router()

  router.post('/case', authMiddleware, async (req, res) => {
    try {
      const data = knowledgeCaseSchema.parse(req.body)
      const saved = await service.saveCase(data)
      return res.status(201).json(saved)
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid body', details: err.issues })
      }
      console.error('POST /api/knowledge/case error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.get('/case/:id', authMiddleware, async (req, res) => {
    try {
      const caseItem = await service.loadCase(req.params.id)
      if (!caseItem) return res.status(404).json({ error: 'Not found' })
      return res.json(caseItem)
    } catch (err) {
      console.error('GET /api/knowledge/case/:id error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.post('/similar', authMiddleware, async (req, res) => {
    try {
      const query = createSimilarCaseQuerySchema.parse(req.body)
      const matches = await service.findSimilarCases(query)
      return res.json(matches)
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid body', details: err.issues })
      }
      console.error('POST /api/knowledge/similar error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.post('/experiment', authMiddleware, async (req, res) => {
    try {
      const data = knowledgeExperimentSchema.parse(req.body)
      const saved = await service.saveExperiment(data)
      return res.status(201).json(saved)
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid body', details: err.issues })
      }
      console.error('POST /api/knowledge/experiment error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.post('/outcome', authMiddleware, async (req, res) => {
    try {
      const data = knowledgeOutcomeSchema.parse(req.body)
      const saved = await service.saveOutcome(data)
      return res.status(201).json(saved)
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid body', details: err.issues })
      }
      console.error('POST /api/knowledge/outcome error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.get('/statistics', authMiddleware, async (req, res) => {
    try {
      const query = createStatisticsQuerySchema.parse(req.query)
      const stats = await service.getStatistics(query)
      return res.json(stats)
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid query', details: err.issues })
      }
      console.error('GET /api/knowledge/statistics error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
