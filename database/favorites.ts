import { Favorite } from '../types'
import db from './init'

function rowToFavorite(row: any): Favorite {
  return {
    eventId: row.eventId,
    userId: row.userId,
    createdAt: row.createdAt,
  }
}

export function getFavoritesByUser(userId: string): Favorite[] {
  const rows = db.getAllSync(
    'SELECT * FROM favorites WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  )
  return rows.map(rowToFavorite)
}

export function isFavorite(eventId: string, userId: string): boolean {
  const row = db.getFirstSync(
    'SELECT 1 FROM favorites WHERE eventId = ? AND userId = ?',
    [eventId, userId]
  )
  return !!row
}

export function addFavorite(eventId: string, userId: string): void {
  db.runSync(
    'INSERT OR IGNORE INTO favorites (eventId, userId, createdAt) VALUES (?, ?, ?)',
    eventId,
    userId,
    new Date().toISOString()
  )
}

export function removeFavorite(eventId: string, userId: string): void {
  db.runSync(
    'DELETE FROM favorites WHERE eventId = ? AND userId = ?',
    [eventId, userId]
  )
}
