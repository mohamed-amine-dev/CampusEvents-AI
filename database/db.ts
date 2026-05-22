import { Platform } from 'react-native'

const isWeb = Platform.OS === 'web'

const dbModule = isWeb
  ? require('./db.web')
  : require('./db.native')

export const executeSql: (sql: string, params?: any[]) => void = dbModule.executeSql
export const queryAll: (sql: string, params?: any[]) => any[] = dbModule.queryAll
export const queryFirst: (sql: string, params?: any[]) => any | null = dbModule.queryFirst
export const execBatch: (sql: string) => void = dbModule.execBatch
export const prepareInsert: (sql: string) => (...args: any[]) => void = dbModule.prepareInsert
