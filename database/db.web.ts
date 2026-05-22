import AsyncStorage from '@react-native-async-storage/async-storage'

const TABLES_KEY = '@campusevents_tables'

interface ColumnDef {
  name: string
  type: string
  constraints: string
}

interface Schema {
  name: string
  columns: ColumnDef[]
  primaryKey?: string
}

const schemas: Record<string, Schema> = {}
let tables: Record<string, any[]> = {}

async function loadTables() {
  try {
    const data = await AsyncStorage.getItem(TABLES_KEY)
    if (data) tables = JSON.parse(data)
  } catch {}
}

async function saveTables() {
  await AsyncStorage.setItem(TABLES_KEY, JSON.stringify(tables))
}

loadTables()

function normalize(v: any): any {
  if (v === null || v === undefined) return null
  const str = String(v)
  if (str === 'null') return null
  return v
}

function parseInsert(sql: string) {
  const m = sql.match(/INSERT\s+(?:OR\s+(\w+)\s+)?INTO\s+(\w+)\s*\(([\s\S]*?)\)\s*VALUES\s*\(([\s\S]*?)\)/i)
  if (!m) throw new Error('Cannot parse INSERT: ' + sql)
  const table = m[2].toLowerCase()
  const columns = m[3].split(',').map(s => s.trim().toLowerCase())
  return { modifier: m[1]?.toLowerCase(), table, columns }
}

function parseSelect(sql: string) {
  const m = sql.match(/SELECT\s+.+\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?(?:\s+ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?)?(?:\s+LIMIT\s+(\d+))?/i)
  if (!m) throw new Error('Cannot parse SELECT: ' + sql)
  const table = m[1].toLowerCase()
  const whereClause = m[2] || ''
  const orderCol = m[3]
  const orderDir = m[4]?.toUpperCase() as 'ASC' | 'DESC' | undefined
  const limit = m[5] ? parseInt(m[5]) : undefined

  const conditions: string[] = []
  if (whereClause) {
    const parts = whereClause.split(/\s+AND\s+/i)
    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed) conditions.push(trimmed)
    }
  }

  return { table, conditions, orderBy: orderCol ? { col: orderCol.toLowerCase(), dir: orderDir || 'ASC' } : undefined, limit }
}

function parseUpdate(sql: string) {
  const m = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i)
  if (!m) throw new Error('Cannot parse UPDATE: ' + sql)
  const table = m[1].toLowerCase()
  const setClause = m[2]
  const whereClause = m[3] || ''

  const setCols: string[] = []
  const setParts = setClause.split(',')
  for (const part of setParts) {
    const cm = part.match(/(\w+)\s*=\s*\?/i)
    if (cm) setCols.push(cm[1].toLowerCase())
  }

  const conditions: string[] = []
  if (whereClause) {
    const parts = whereClause.split(/\s+AND\s+/i)
    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed) conditions.push(trimmed)
    }
  }

  return { table, setCols, conditions }
}

function parseDelete(sql: string) {
  const m = sql.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i)
  if (!m) throw new Error('Cannot parse DELETE: ' + sql)
  const table = m[1].toLowerCase()
  const whereClause = m[2] || ''

  const conditions: string[] = []
  if (whereClause) {
    const parts = whereClause.split(/\s+AND\s+/i)
    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed) conditions.push(trimmed)
    }
  }

  return { table, conditions }
}

function matchesRow(row: Record<string, any>, conditions: string[], params: any[]): boolean {
  let paramIdx = 0
  for (const cond of conditions) {
    const opMatch = cond.match(/(\w+)\s*(=|!=|<>|>|<|>=|<=|LIKE|IN|IS\s+NOT|IS)\s*(.+)/i)
    if (!opMatch) continue
    const col = opMatch[1].toLowerCase()
    const op = opMatch[2].toUpperCase().trim()
    const valPlaceholder = opMatch[3].trim()
    const rowVal = row[col]

    if (op === 'IS NOT' || op === 'IS') {
      const target = valPlaceholder.toUpperCase()
      if (op === 'IS') return target === 'NULL' ? rowVal === null || rowVal === undefined : rowVal === target
      if (op === 'IS NOT') return target === 'NULL' ? rowVal !== null && rowVal !== undefined : rowVal !== target
    }

    if (op === 'IN') {
      const inMatch = valPlaceholder.match(/\((.+)\)/)
      if (!inMatch) continue
      const items = inMatch[1].split(',').map(s => s.trim().replace(/^'(.*)'$/, '$1'))
      const matches = items.includes(rowVal)
      if (!matches) return false
      continue
    }

    const paramVal = normalize(params[paramIdx++])
    const rv = normalize(rowVal)

    if (op === 'LIKE') {
      const pattern = String(paramVal).replace(/%/g, '.*')
      if (!new RegExp(`^${pattern}$`, 'i').test(String(rv))) return false
      continue
    }

    let matches = false
    switch (op) {
      case '=': matches = rv === paramVal; break
      case '!=': case '<>': matches = rv !== paramVal; break
      case '>': matches = rv > paramVal; break
      case '<': matches = rv < paramVal; break
      case '>=': matches = rv >= paramVal; break
      case '<=': matches = rv <= paramVal; break
    }
    if (!matches) return false
  }
  return true
}

export function executeSql(sql: string, params?: any[]): void {
  sql = sql.trim()
  params = params || []
  const tableMatch = sql.match(/\b(?:INTO|FROM|UPDATE)\s+(\w+)/i)
  if (!tableMatch) return
  const table = tableMatch[1].toLowerCase()

  if (!tables[table]) tables[table] = []

  if (/^INSERT\b/i.test(sql)) {
    const { modifier, columns } = parseInsert(sql)
    const row: Record<string, any> = {}
    columns.forEach((col, i) => { row[col] = normalize(params![i]) })

    if (modifier === 'ignore') {
      const pk = schemas[table]?.primaryKey
      if (pk && row[pk] !== null && tables[table].some((r: any) => r[pk] === row[pk])) return
    }

    if (modifier === 'replace') {
      const pk = schemas[table]?.primaryKey
      if (pk && row[pk] !== null) tables[table] = tables[table].filter((r: any) => r[pk] !== row[pk])
    }

    tables[table].push(row)
    saveTables()
  } else if (/^UPDATE\b/i.test(sql)) {
    const { setCols, conditions } = parseUpdate(sql)
    let paramIdx = 0
    for (const row of tables[table]) {
      const condParams = params.slice(setCols.length)
      if (matchesRow(row, conditions, condParams)) {
        for (const col of setCols) {
          row[col] = normalize(params[paramIdx++])
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
    rows = rows.filter(row => matchesRow(row, conditions, params))
  }

  if (isCount) {
    const alias = countAliasMatch?.[1] || 'count'
    return [{ [alias]: rows.length }]
  }

  const isSelect1 = /^SELECT\s+1\b/i.test(sql.trim())
  if (isSelect1) return rows.length > 0 ? [rows[0]] : []

  if (orderBy) {
    rows.sort((a: any, b: any) => {
      const av = a[orderBy!.col]; const bv = b[orderBy!.col]
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
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean)
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
        const colDefs = colsMatch[1].split(',').map(s => s.trim()).filter(s => !/^FOREIGN\s+KEY/i.test(s) && !/^PRIMARY\s+KEY/i.test(s))
        let pk: string | undefined
        const pkMatch = colsMatch[1].match(/PRIMARY\s+KEY\s*\((\w+)\)/i)
        if (pkMatch) pk = pkMatch[1].toLowerCase()

        schemas[tableName] = { name: tableName, columns: [], primaryKey: pk }
        for (const def of colDefs) {
          const m = def.match(/^\s*(\w+)\s+(\w+)(.*)/)
          if (m) schemas[tableName].columns.push({ name: m[1].toLowerCase(), type: m[2], constraints: m[3] || '' })
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
    columns.forEach((col, i) => { row[col] = normalize(args[i]) })
    tables[table].push(row)
    saveTables()
  }
}
