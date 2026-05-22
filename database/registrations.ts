import { v4 as uuidv4 } from 'uuid'
import { Registration } from '../types'
import db from './init'
import { getEventById } from './events'

function rowToRegistration(row: any): Registration {
  return {
    id: row.id,
    eventId: row.eventId,
    userId: row.userId,
    createdAt: row.createdAt,
    status: row.status,
  }
}

export function getRegistrationsByUser(userId: string): Registration[] {
  const rows = db.queryAll(
    'SELECT * FROM registrations WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  )
  return rows.map(rowToRegistration)
}

export function getRegistration(eventId: string, userId: string): Registration | undefined {
  const row = db.queryFirst(
    'SELECT * FROM registrations WHERE eventId = ? AND userId = ?',
    [eventId, userId]
  ) as any
  return row ? rowToRegistration(row) : undefined
}

export function registerForEvent(eventId: string, userId: string): { success: boolean; error?: string } {
  const event = getEventById(eventId)
  if (!event) return { success: false, error: 'Événement introuvable' }

  const startDate = new Date(event.startDateTime)
  if (startDate < new Date()) return { success: false, error: 'Cet événement est déjà passé' }

  if (event.capacity && event.registeredCount >= event.capacity) {
    return { success: false, error: 'Événement complet' }
  }

  const existing = getRegistration(eventId, userId)
  if (existing) return { success: false, error: 'Vous êtes déjà inscrit' }

  const id = uuidv4()
  db.executeSql(
    'INSERT INTO registrations (id, eventId, userId, createdAt, status) VALUES (?, ?, ?, ?, ?)',
    [id, eventId, userId, new Date().toISOString(), 'confirmed']
  )

  db.executeSql('UPDATE events SET registeredCount = registeredCount + 1 WHERE id = ?', [eventId])

  return { success: true }
}

export function cancelRegistration(eventId: string, userId: string): void {
  db.executeSql(
    'DELETE FROM registrations WHERE eventId = ? AND userId = ?',
    [eventId, userId]
  )
  db.executeSql('UPDATE events SET registeredCount = MAX(0, registeredCount - 1) WHERE id = ?', [eventId])
}
