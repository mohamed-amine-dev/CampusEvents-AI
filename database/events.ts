import { Event, Category } from '../types'
import db from './init'

function rowToEvent(row: any): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as Category,
    startDateTime: row.startDateTime,
    endDateTime: row.endDateTime ?? undefined,
    locationName: row.locationName,
    locationAddress: row.locationAddress ?? undefined,
    organizerName: row.organizerName,
    capacity: row.capacity ?? undefined,
    registeredCount: row.registeredCount,
    imageUrl: row.imageUrl ?? undefined,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    createdAt: row.createdAt,
  }
}

export function getAllEvents(): Event[] {
  const rows = db.getAllSync('SELECT * FROM events ORDER BY startDateTime DESC')
  return rows.map(rowToEvent)
}

export function getUpcomingEvents(): Event[] {
  const now = new Date().toISOString()
  const rows = db.getAllSync(
    'SELECT * FROM events WHERE startDateTime > ? ORDER BY startDateTime ASC',
    [now]
  )
  return rows.map(rowToEvent)
}

export function getPastEvents(): Event[] {
  const now = new Date().toISOString()
  const rows = db.getAllSync(
    'SELECT * FROM events WHERE startDateTime <= ? ORDER BY startDateTime DESC',
    [now]
  )
  return rows.map(rowToEvent)
}

export function getEventsByCategory(category: Category): Event[] {
  const rows = db.getAllSync('SELECT * FROM events WHERE category = ? ORDER BY startDateTime DESC', [category])
  return rows.map(rowToEvent)
}

export function searchEvents(query: string): Event[] {
  const like = `%${query}%`
  const rows = db.getAllSync(
    'SELECT * FROM events WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ? ORDER BY startDateTime DESC',
    [like.toLowerCase(), like.toLowerCase(), like.toLowerCase()]
  )
  return rows.map(rowToEvent)
}

export function getEventById(id: string): Event | undefined {
  const row = db.getFirstSync('SELECT * FROM events WHERE id = ?', [id]) as any
  return row ? rowToEvent(row) : undefined
}

export function createEvent(event: Event): void {
  db.runSync(
    `INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, tags, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    event.id,
    event.title,
    event.description,
    event.category,
    event.startDateTime,
    event.endDateTime ?? null,
    event.locationName,
    event.locationAddress ?? null,
    event.organizerName,
    event.capacity ?? null,
    event.registeredCount,
    event.tags ? JSON.stringify(event.tags) : null,
    event.createdAt
  )
}

export function updateEvent(event: Event): void {
  db.runSync(
    `UPDATE events SET title=?, description=?, category=?, startDateTime=?, endDateTime=?, locationName=?, locationAddress=?, organizerName=?, capacity=?, tags=? WHERE id=?`,
    event.title,
    event.description,
    event.category,
    event.startDateTime,
    event.endDateTime ?? null,
    event.locationName,
    event.locationAddress ?? null,
    event.organizerName,
    event.capacity ?? null,
    event.tags ? JSON.stringify(event.tags) : null,
    event.id
  )
}

export function deleteEvent(id: string): void {
  db.runSync('DELETE FROM registrations WHERE eventId = ?', [id])
  db.runSync('DELETE FROM favorites WHERE eventId = ?', [id])
  db.runSync('DELETE FROM events WHERE id = ?', [id])
}
