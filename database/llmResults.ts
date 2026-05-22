import { queryAll, queryFirst, executeSql } from './db'

export interface LLMResult {
  id: string
  eventId?: string
  userId: string
  type: string
  inputText: string
  outputText: string
  createdAt: string
}

export function saveLLMResult(result: LLMResult): void {
  executeSql(
    'INSERT INTO llm_results (id, eventId, userId, type, inputText, outputText, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [result.id, result.eventId ?? null, result.userId, result.type, result.inputText, result.outputText, result.createdAt]
  )
}

export function getCachedLLMResult(userId: string, type: string, inputText: string): LLMResult | null {
  return queryFirst(
    'SELECT * FROM llm_results WHERE userId = ? AND type = ? AND inputText = ? ORDER BY createdAt DESC LIMIT 1',
    [userId, type, inputText]
  ) as any
}

export function getLLMResultsByUser(userId: string, type?: string): LLMResult[] {
  if (type) {
    return queryAll('SELECT * FROM llm_results WHERE userId = ? AND type = ? ORDER BY createdAt DESC', [userId, type]) as any[]
  }
  return queryAll('SELECT * FROM llm_results WHERE userId = ? ORDER BY createdAt DESC', [userId]) as any[]
}
