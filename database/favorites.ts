import { queryAll, queryFirst, executeSql } from './db'

export function getFavoritesByUser(userId: string): { eventId: string; userId: string; createdAt: string }[] {
  return queryAll('SELECT * FROM favorites WHERE userId = ? ORDER BY createdAt DESC', [userId]) as any[]
}

export function isFavorite(eventId: string, userId: string): boolean {
  const result = queryFirst('SELECT * FROM favorites WHERE eventId = ? AND userId = ?', [eventId, userId])
  return !!result
}

export function addFavorite(eventId: string, userId: string): void {
  const createdAt = new Date().toISOString()
  executeSql('INSERT OR IGNORE INTO favorites (eventId, userId, createdAt) VALUES (?, ?, ?)', [eventId, userId, createdAt])
}

export function removeFavorite(eventId: string, userId: string): void {
  executeSql('DELETE FROM favorites WHERE eventId = ? AND userId = ?', [eventId, userId])
}
