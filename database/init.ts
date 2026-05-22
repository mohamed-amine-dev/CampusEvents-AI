import AsyncStorage from '@react-native-async-storage/async-storage'
import { execBatch, executeSql, queryAll } from './db'
import { seedEvents } from '../constants/seed'

const SCHEMA_VERSION = 'v2'

export async function initDatabase() {
  execBatch(`
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

    PRAGMA foreign_keys = ON;
  `)

  const prevVersion = await AsyncStorage.getItem('@campus_db_version')

  if (prevVersion !== SCHEMA_VERSION) {
    if (prevVersion !== null) {
      await AsyncStorage.removeItem('@campusevents_tables')
      execBatch(`
        DELETE FROM events;
        DELETE FROM registrations;
        DELETE FROM favorites;
        DELETE FROM llm_results;
      `)
    }
    await AsyncStorage.setItem('@campus_db_version', SCHEMA_VERSION)
  }

  const count = queryAll('SELECT COUNT(*) as count FROM events') as { count: number }[]
  if (count[0].count === 0) {
    for (const event of seedEvents) {
      executeSql(
        `INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, imageUrl, tags, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.id,
          event.title,
          event.description,
          event.category,
          event.startDateTime,
          event.endDateTime || null,
          event.locationName,
          event.locationAddress || null,
          event.organizerName,
          event.capacity ?? null,
          event.registeredCount || 0,
          event.imageUrl || null,
          event.tags ? JSON.stringify(event.tags) : null,
          event.createdAt,
        ]
      )
    }
  }
}
