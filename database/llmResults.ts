import { LLMResult } from '../types'
import db from './init'

function rowToLLMResult(row: any): LLMResult {
  return {
    id: row.id,
    eventId: row.eventId ?? undefined,
    userId: row.userId,
    type: row.type,
    inputText: row.inputText,
    outputText: row.outputText,
    createdAt: row.createdAt,
  }
}

export function saveLLMResult(result: LLMResult): void {
  db.runSync(
    'INSERT OR REPLACE INTO llm_results (id, eventId, userId, type, inputText, outputText, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    result.id,
    result.eventId ?? null,
    result.userId,
    result.type,
    result.inputText,
    result.outputText,
    result.createdAt
  )
}

export function getCachedResult(userId: string, type: string, inputText: string): LLMResult | undefined {
  const rows = db.getAllSync(
    'SELECT * FROM llm_results WHERE userId = ? AND type = ? AND inputText = ? ORDER BY createdAt DESC LIMIT 1',
    [userId, type, inputText]
  ) as any[]
  return rows.length > 0 ? rowToLLMResult(rows[0]) : undefined
}

export function getLLMResultsByUser(userId: string, type?: string): LLMResult[] {
  if (type) {
    const rows = db.getAllSync(
      'SELECT * FROM llm_results WHERE userId = ? AND type = ? ORDER BY createdAt DESC',
      [userId, type]
    )
    return rows.map(rowToLLMResult)
  }
  const rows = db.getAllSync(
    'SELECT * FROM llm_results WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  )
  return rows.map(rowToLLMResult)
}
