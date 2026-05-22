import * as SQLite from 'expo-sqlite'
import { seedEvents } from '../constants/seed'

const db = SQLite.openDatabaseSync('campusevents.db')

export function initDatabase() {
  db.execSync(`PRAGMA foreign_keys = ON;`)

  db.execSync(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      startDateTime TEXT NOT NULL,
      endDateTime TEXT,
      locationName TEXT NOT NULL,
      locationAddress TEXT,
      organizerName TEXT NOT NULL,
      capacity INTEGER,
      registeredCount INTEGER DEFAULT 0,
      imageUrl TEXT,
      tags TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      eventId TEXT NOT NULL,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (eventId, userId),
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS llm_results (
      id TEXT PRIMARY KEY,
      eventId TEXT,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      inputText TEXT NOT NULL,
      outputText TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `)

  const count = db.getAllSync('SELECT COUNT(*) as count FROM events') as { count: number }[]
  if (count[0].count === 0) {
    seedDatabase()
  }
}

function seedDatabase() {
  const insertStmt = db.prepareSync(`
    INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, tags, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const event of seedEvents) {
    insertStmt.executeSync(
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
      JSON.stringify(event.tags ?? []),
      event.createdAt
    )
  }
}

export default db
