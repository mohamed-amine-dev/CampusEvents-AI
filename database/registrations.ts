import { queryAll, queryFirst, executeSql } from './db'
import { getEventById, incrementRegisteredCount, decrementRegisteredCount } from './events'

export interface Registration {
  id: string
  eventId: string
  userId: string
  createdAt: string
  status: string
}

export function getRegistrationsByUser(userId: string): Registration[] {
  return queryAll('SELECT * FROM registrations WHERE userId = ? AND status = ? ORDER BY createdAt DESC', [userId, 'confirmed']) as any[]
}

export function getRegistrationByEventAndUser(eventId: string, userId: string): Registration | null {
  return queryFirst('SELECT * FROM registrations WHERE eventId = ? AND userId = ? AND status = ?', [eventId, userId, 'confirmed']) as any
}

export function registerForEvent(id: string, eventId: string, userId: string): Registration {
  const createdAt = new Date().toISOString()
  executeSql('INSERT INTO registrations (id, eventId, userId, createdAt, status) VALUES (?, ?, ?, ?, ?)', [id, eventId, userId, createdAt, 'confirmed'])
  incrementRegisteredCount(eventId)
  return { id, eventId, userId, createdAt, status: 'confirmed' }
}

export function cancelRegistration(eventId: string, userId: string): void {
  executeSql('UPDATE registrations SET status = ? WHERE eventId = ? AND userId = ? AND status = ?', ['cancelled', eventId, userId, 'confirmed'])
  decrementRegisteredCount(eventId)
}

export function getEventWithRegistrationStatus(eventId: string, userId: string) {
  const event = getEventById(eventId)
  const registration = getRegistrationByEventAndUser(eventId, userId)
  const isFav = require('./favorites').isFavorite(eventId, userId)
  return { event, isRegistered: !!registration, isFavorite: isFav }
}
