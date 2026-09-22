import { SqliteKnowledgeRepository } from '@/engine/knowledge'
import type { KnowledgeRepository } from '@/engine/knowledge'

export function createKnowledgeRepository(): KnowledgeRepository {
  const databasePath = process.env.KNOWLEDGE_DB_PATH || 'knowledge.db'
  return new SqliteKnowledgeRepository(databasePath)
}
