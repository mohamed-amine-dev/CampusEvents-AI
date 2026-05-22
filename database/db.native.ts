import * as SQLite from 'expo-sqlite'

let db: SQLite.SQLiteDatabase | null = null

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('campusevents.db')
  }
  return db
}

export function executeSql(sql: string, params?: any[]): void {
  if (params && params.length > 0) {
    getDb().runSync(sql, params as any)
  } else {
    getDb().runSync(sql)
  }
}

export function queryAll(sql: string, params?: any[]): any[] {
  if (params && params.length > 0) {
    return getDb().getAllSync(sql, params as any)
  }
  return getDb().getAllSync(sql)
}

export function queryFirst(sql: string, params?: any[]): any | null {
  if (params && params.length > 0) {
    return getDb().getFirstSync(sql, params as any)
  }
  return getDb().getFirstSync(sql)
}

export function execBatch(sql: string): void {
  getDb().execSync(sql)
}

export function prepareInsert(sql: string): (...args: any[]) => void {
  return (...args: any[]) => {
    getDb().runSync(sql, args as any)
  }
}
