import { Platform } from 'react-native'

const isWeb = Platform.OS === 'web'

let db: {
  executeSql(sql: string, params?: any[]): void
  queryAll(sql: string, params?: any[]): any[]
  queryFirst(sql: string, params?: any[]): any | null
  execBatch(sql: string): void
  prepareInsert(sql: string): (...args: any[]) => void
}

if (isWeb) {
  const webDb = require('./db.web')
  db = webDb
} else {
  const nativeDb = require('./db.native')
  db = nativeDb
}

export default db
