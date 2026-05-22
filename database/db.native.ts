import * as SQLite from 'expo-sqlite'

const db = SQLite.openDatabaseSync('campusevents.db')

export function executeSql(sql: string, params?: any[]): void {
  db.runSync(sql, ...(params || []))
}

export function queryAll(sql: string, params?: any[]): any[] {
  return db.getAllSync(sql, params || []) as any[]
}

export function queryFirst(sql: string, params?: any[]): any | null {
  return (db.getFirstSync(sql, params || []) as any) || null
}

export function execBatch(sql: string): void {
  db.execSync(sql)
}

export function prepareInsert(sql: string): (...args: any[]) => void {
  const stmt = db.prepareSync(sql)
  return (...args: any[]) => {
    stmt.executeSync(...args)
  }
}
