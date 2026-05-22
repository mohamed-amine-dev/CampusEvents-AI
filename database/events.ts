import { queryAll, queryFirst, executeSql } from './db'

export interface Event {
  id: string
  title: string
  description: string
  category: string
  startDateTime: string
  endDateTime?: string
  locationName: string
  locationAddress?: string
  organizerName: string
  capacity?: number
  registeredCount: number
  imageUrl?: string
  tags?: string[]
  createdAt: string
}

function rowToEvent(row: any): Event {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    capacity: row.capacity ?? undefined,
    endDateTime: row.endDateTime ?? undefined,
    locationAddress: row.locationAddress ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
  }
}

export function getAllEvents(): Event[] {
  return (queryAll('SELECT * FROM events ORDER BY startDateTime ASC') as any[]).map(rowToEvent)
}

export function getEventById(id: string): Event | null {
  const row = queryFirst('SELECT * FROM events WHERE id = ?', [id])
  return row ? rowToEvent(row) : null
}

export function getUpcomingEvents(): Event[] {
  const now = new Date().toISOString()
  return (queryAll('SELECT * FROM events WHERE startDateTime > ? ORDER BY startDateTime ASC', [now]) as any[]).map(rowToEvent)
}

export function getPastEvents(): Event[] {
  const now = new Date().toISOString()
  return (queryAll('SELECT * FROM events WHERE startDateTime <= ? ORDER BY startDateTime DESC', [now]) as any[]).map(rowToEvent)
}

export function searchEvents(query: string): Event[] {
  return (queryAll('SELECT * FROM events WHERE LOWER(title) LIKE ? ORDER BY startDateTime ASC', [`%${query.toLowerCase()}%`]) as any[]).map(rowToEvent)
}

export function getEventsByCategory(category: string): Event[] {
  return (queryAll('SELECT * FROM events WHERE category = ? ORDER BY startDateTime ASC', [category]) as any[]).map(rowToEvent)
}

export function createEvent(event: Omit<Event, 'registeredCount' | 'createdAt'>): Event {
  const createdAt = new Date().toISOString()
  executeSql(
    `INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, imageUrl, tags, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [event.id, event.title, event.description, event.category, event.startDateTime, event.endDateTime ?? null, event.locationName, event.locationAddress ?? null, event.organizerName, event.capacity ?? null, event.imageUrl ?? null, event.tags ? JSON.stringify(event.tags) : null, createdAt]
  )
  return { ...event, registeredCount: 0, createdAt }
}

export function updateEvent(event: Partial<Event> & { id: string }): void {
  const fields: string[] = []
  const values: any[] = []

  if (event.title !== undefined) { fields.push('title = ?'); values.push(event.title) }
  if (event.description !== undefined) { fields.push('description = ?'); values.push(event.description) }
  if (event.category !== undefined) { fields.push('category = ?'); values.push(event.category) }
  if (event.startDateTime !== undefined) { fields.push('startDateTime = ?'); values.push(event.startDateTime) }
  if (event.endDateTime !== undefined) { fields.push('endDateTime = ?'); values.push(event.endDateTime) }
  if (event.locationName !== undefined) { fields.push('locationName = ?'); values.push(event.locationName) }
  if (event.locationAddress !== undefined) { fields.push('locationAddress = ?'); values.push(event.locationAddress) }
  if (event.organizerName !== undefined) { fields.push('organizerName = ?'); values.push(event.organizerName) }
  if (event.capacity !== undefined) { fields.push('capacity = ?'); values.push(event.capacity) }
  if (event.imageUrl !== undefined) { fields.push('imageUrl = ?'); values.push(event.imageUrl) }
  if (event.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(event.tags)) }

  if (fields.length === 0) return
  values.push(event.id)
  executeSql(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`, values)
}

export function deleteEvent(id: string): void {
  executeSql('DELETE FROM events WHERE id = ?', [id])
}

export function incrementRegisteredCount(eventId: string): void {
  executeSql('UPDATE events SET registeredCount = registeredCount + 1 WHERE id = ?', [eventId])
}

export function decrementRegisteredCount(eventId: string): void {
  executeSql('UPDATE events SET registeredCount = MAX(0, registeredCount - 1) WHERE id = ?', [eventId])
}
