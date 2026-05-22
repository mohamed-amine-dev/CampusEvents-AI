import AsyncStorage from '@react-native-async-storage/async-storage'

const TABLES_KEY = '@campus.db_tables'

interface TableSchema {
  name: string
  columns: { name: string; type: string; constraints: string }[]
  primaryKey?: string
}

let tables: Record<string, any[]> = {}
let schemas: Record<string, TableSchema> = {}

function normalize(val: any): any {
  return val === undefined ? null : val
}

function matchValue(row: any, col: string, op: string, param: any): boolean {
  const val = row[col]
  switch (op) {
    case '=':
      if (param === null || param === undefined) return val === null || val === undefined
      return String(val).toLowerCase() === String(param).toLowerCase()
    case '>':
      return new Date(val).getTime() > new Date(param).getTime()
    case '<=':
      return new Date(val).getTime() <= new Date(param).getTime()
    case 'LIKE':
      const likePattern = String(param).replace(/%/g, '.*').toLowerCase()
      return new RegExp('^' + likePattern + '$').test(String(val).toLowerCase())
    case 'LOWER_LIKE':
      const lowerVal = String(val).toLowerCase()
      const pattern = String(param).toLowerCase().replace(/%/g, '.*')
      return new RegExp('^' + pattern + '$').test(lowerVal)
    default:
      return false
  }
}

function parseWhere(sql: string): { conditions: { col: string; op: string; paramIdx: number }[]; rest: string } {
  const whereMatch = sql.match(/\bWHERE\b\s+(.*)/i)
  if (!whereMatch) return { conditions: [], rest: sql }

  let whereClause = whereMatch[1]
  const conditions: { col: string; op: string; paramIdx: number }[] = []
  let paramIdx = 0

  const parts = whereClause.split(/\s+AND\s+/i)
  for (const part of parts) {
    const trimmed = part.trim()
    let match

    if ((match = trimmed.match(/LOWER\((\w+)\)\s+LIKE\s+\?/i))) {
      conditions.push({ col: match[1].toLowerCase(), op: 'LOWER_LIKE', paramIdx: paramIdx++ })
    } else if ((match = trimmed.match(/(\w+)\s*(=|>|<=)\s*\?/))) {
      conditions.push({ col: match[1].toLowerCase(), op: match[2], paramIdx: paramIdx++ })
    } else if ((match = trimmed.match(/(\w+)\s+LIKE\s+\?/i))) {
      conditions.push({ col: match[1].toLowerCase(), op: 'LIKE', paramIdx: paramIdx++ })
    }
  }

  return { conditions, rest: sql.substring(0, whereMatch.index!) }
}

function matchesRow(row: any, conditions: { col: string; op: string; paramIdx: number }[], params: any[]): boolean {
  for (const c of conditions) {
    const p = params[c.paramIdx]
    if (!matchValue(row, c.col, c.op, p)) return false
  }
  return true
}

function parseSelect(sql: string): { table: string; conditions: any; orderBy?: { col: string; dir: string }; limit?: number } {
  const tableMatch = sql.match(/\bFROM\s+(\w+)/i)
  if (!tableMatch) throw new Error('Cannot parse table from: ' + sql)
  const table = tableMatch[1].toLowerCase()

  let orderBy: { col: string; dir: string } | undefined
  const orderMatch = sql.match(/\bORDER\s+BY\s+(\w+)\s+(ASC|DESC)/i)
  if (orderMatch) orderBy = { col: orderMatch[1].toLowerCase(), dir: orderMatch[2].toUpperCase() }

  let limit: number | undefined
  const limitMatch = sql.match(/\bLIMIT\s+(\d+)/i)
  if (limitMatch) limit = parseInt(limitMatch[1], 10)

  const { conditions } = parseWhere(sql)

  return { table, conditions, orderBy, limit }
}

function parseInsert(sql: string): { table: string; columns: string[] } {
  const match = sql.match(/INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES/i)
  if (!match) throw new Error('Cannot parse INSERT from: ' + sql)
  const table = match[1].toLowerCase()
  const columns = match[2].split(',').map((c) => c.trim().toLowerCase())
  return { table, columns }
}

function parseDelete(sql: string): { table: string; conditions: any } {
  const tableMatch = sql.match(/\bFROM\s+(\w+)/i)
  if (!tableMatch) throw new Error('Cannot parse DELETE FROM: ' + sql)
  const table = tableMatch[1].toLowerCase()
  const { conditions } = parseWhere(sql)
  return { table, conditions }
}

function parseUpdate(sql: string): { table: string; setCols: string[]; conditions: any } {
  const tableMatch = sql.match(/\bUPDATE\s+(\w+)\s+SET\s+(.*?)(?:\s+WHERE|$)/i)
  if (!tableMatch) throw new Error('Cannot parse UPDATE: ' + sql)
  const table = tableMatch[1].toLowerCase()
  const setClause = tableMatch[2]
  const setCols = setClause.split(',').map((s) => {
    const m = s.match(/\s*(\w+)\s*=/)
    return m ? m[1].toLowerCase() : ''
  }).filter(Boolean)
  const { conditions } = parseWhere(sql)
  return { table, setCols, conditions }
}

function isOrReplace(sql: string): boolean {
  return /\bOR\s+REPLACE\b/i.test(sql)
}

function isIgnore(sql: string): boolean {
  return /\bOR\s+IGNORE\b/i.test(sql)
}

async function loadTables() {
  try {
    const data = await AsyncStorage.getItem(TABLES_KEY)
    if (data) {
      tables = JSON.parse(data)
    }
  } catch {}
}

async function saveTables() {
  await AsyncStorage.setItem(TABLES_KEY, JSON.stringify(tables))
}

loadTables()

export function executeSql(sql: string, params?: any[]): void {
  sql = sql.trim()
  params = params || []
  const tableMatch = sql.match(/\b(?:INTO|FROM|UPDATE)\s+(\w+)/i)
  if (!tableMatch) return
  const table = tableMatch[1].toLowerCase()

  if (!tables[table]) tables[table] = []

  if (/^INSERT\b/i.test(sql)) {
    const { columns } = parseInsert(sql)
    const row: Record<string, any> = {}
    columns.forEach((col, i) => {
      row[col] = normalize(params![i])
    })

    if (isIgnore(sql)) {
      const pk = schemas[table]?.primaryKey
      if (pk && row[pk] !== null) {
        const exists = tables[table].some((r: any) => r[pk] === row[pk])
        if (exists) return
      }
    }

    if (isOrReplace(sql)) {
      const pk = schemas[table]?.primaryKey
      if (pk && row[pk] !== null) {
        tables[table] = tables[table].filter((r: any) => r[pk] !== row[pk])
      }
    }

    tables[table].push(row)
    saveTables()
  } else if (/^UPDATE\b/i.test(sql)) {
    const { setCols, conditions } = parseUpdate(sql)
    for (const row of tables[table]) {
      if (matchesRow(row, conditions, params)) {
        let pi = conditions.length
        for (const col of setCols) {
          if (col === 'registeredcount') {
            const expr = sql.match(new RegExp(col + '\\s*=\\s*(.*?)(?:,|\\s+WHERE|$)', 'i'))
            if (expr) {
              const exprStr = expr[1].trim()
              const addMatch = exprStr.match(/(\w+)\s*\+\s*(\d+)/i)
              if (addMatch) {
                row[col] = (parseInt(row[col] || 0) + parseInt(addMatch[2]))
              }
              const maxMatch = exprStr.match(/MAX\s*\(\s*0\s*,\s*(\w+)\s*-\s*(\d+)\s*\)/i)
              if (maxMatch) {
                row[col] = Math.max(0, parseInt(row[col] || 0) - parseInt(maxMatch[2]))
              }
            }
          } else {
            row[col] = normalize(params![pi++])
          }
        }
      }
    }
    saveTables()
  } else if (/^DELETE\b/i.test(sql)) {
    const { conditions } = parseDelete(sql)
    if (conditions.length === 0) {
      tables[table] = []
    } else {
      tables[table] = tables[table].filter((row: any) => !matchesRow(row, conditions, params))
    }
    saveTables()
  }
}

export function queryAll(sql: string, params?: any[]): any[] {
  sql = sql.trim()
  params = params || []

  const isCount = /COUNT\s*\(\s*\*\s*\)/i.test(sql)
  const countAliasMatch = sql.match(/COUNT\s*\(\s*\*\s*\)\s*(?:as\s+)?(\w+)/i)

  const { table, conditions, orderBy, limit } = parseSelect(sql)

  if (!tables[table]) return isCount ? [{ [countAliasMatch?.[1] || 'count']: 0 }] : []

  let rows = [...tables[table]]
  if (conditions.length > 0) {
    rows = rows.filter((row) => matchesRow(row, conditions, params))
  }

  if (isCount) {
    const alias = countAliasMatch?.[1] || 'count'
    return [{ [alias]: rows.length }]
  }

  const isSelect1 = /^SELECT\s+1\b/i.test(sql.trim())
  if (isSelect1) {
    return rows.length > 0 ? [rows[0]] : []
  }

  if (orderBy) {
    rows.sort((a: any, b: any) => {
      const av = a[orderBy!.col]
      const bv = b[orderBy!.col]
      if (av === undefined || av === null) return 1
      if (bv === undefined || bv === null) return -1
      const cmp = String(av).localeCompare(String(bv))
      return orderBy!.dir === 'DESC' ? -cmp : cmp
    })
  }

  if (limit) rows = rows.slice(0, limit)

  return rows
}

export function queryFirst(sql: string, params?: any[]): any | null {
  const rows = queryAll(sql, params)
  return rows.length > 0 ? rows[0] : null
}

export function execBatch(sql: string): void {
  const statements = sql.split(';').map((s) => s.trim()).filter(Boolean)
  for (const stmt of statements) {
    if (/^PRAGMA\b/i.test(stmt)) continue
    if (/^CREATE\s+TABLE\b/i.test(stmt)) {
      const nameMatch = stmt.match(/CREATE\s+TABLE\s+(?:\w+\s+)?(\w+)/i)
      if (!nameMatch) continue
      const tableName = nameMatch[1].toLowerCase()
      if (tables[tableName]) continue
      tables[tableName] = []

      const colsMatch = stmt.match(/\(([\s\S]*?)\)\s*$/)
      if (colsMatch) {
        const colDefs = colsMatch[1].split(',').map((s) => s.trim()).filter((s) => !/^FOREIGN\s+KEY/i.test(s) && !/^PRIMARY\s+KEY/i.test(s))
        let pk: string | undefined
        const pkMatch = colsMatch[1].match(/PRIMARY\s+KEY\s*\((\w+)\)/i)
        if (pkMatch) pk = pkMatch[1].toLowerCase()

        schemas[tableName] = {
          name: tableName,
          columns: [],
          primaryKey: pk,
        }

        for (const def of colDefs) {
          const m = def.match(/^\s*(\w+)\s+(\w+)(.*)/)
          if (m) {
            schemas[tableName].columns.push({
              name: m[1].toLowerCase(),
              type: m[2],
              constraints: m[3] || '',
            })
          }
        }
      }
      saveTables()
    }
  }
}

export function prepareInsert(sql: string): (...args: any[]) => void {
  const { table, columns } = parseInsert(sql)
  return (...args: any[]) => {
    if (!tables[table]) tables[table] = []
    const row: Record<string, any> = {}
    columns.forEach((col, i) => {
      row[col] = normalize(args[i])
    })
    tables[table].push(row)
    saveTables()
  }
}
