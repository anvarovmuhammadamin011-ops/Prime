import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const TIMESTAMP = "strftime('%Y-%m-%dT%H:%M:%fZ','now')"
const ANY_TOKEN = '__pg_any_raw_'

const POSTGRES_ERROR_CODES = [
  [/UNIQUE constraint failed/i, '23505'],
  [/FOREIGN KEY constraint failed/i, '23503'],
  [/NOT NULL constraint failed/i, '23502'],
  [/CHECK constraint failed/i, '23514'],
]

function toPgError(error) {
  for (const [pattern, code] of POSTGRES_ERROR_CODES) {
    if (pattern.test(error?.message || '')) {
      error.code = code
      return error
    }
  }
  return error
}

function normalizeValue(value) {
  if (value === undefined) return null
  if (value === true) return 1
  if (value === false) return 0
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return JSON.stringify(value)
  if (value && typeof value === 'object') return JSON.stringify(value)
  return value
}

function translate(sql) {
  let out = sql

  out = out.replace(
    /(?:=\s*)?ANY\(\s*\$(\d+)\s*::[A-Za-z_][A-Za-z0-9_]*\s*\[\]\s*\)/gi,
    (match, index) => `${ANY_TOKEN}${index}__`,
  )

  const ctes = []
  let seriesIndex = 0
  out = out.replace(
    /generate_series\(\s*([^,()]+?)\s*,\s*([^,()]+?)\s*\)\s*(?:AS\s+)?([A-Za-z_]\w*)?\s*(?:\(\s*([A-Za-z_]\w*)\s*\))?/gi,
    (match, start, end, alias, column) => {
      const name = `_pg_series_${seriesIndex}`
      const col = column || 'n'
      ctes.push(
        `${name}(${col}) AS (SELECT ${start} UNION ALL SELECT ${col} + 1 FROM ${name} WHERE ${col} < ${end})`,
      )
      seriesIndex += 1
      return alias ? `${name} AS ${alias}` : `${name}(${col})`
    },
  )

  if (ctes.length > 0) {
    if (/^\s*WITH\s/i.test(out)) {
      out = out.replace(/^(\s*)WITH\s+(RECURSIVE\s+)?/i, (match, indent, recursive) => {
        return `${indent}WITH ${recursive || ''}${ctes.join(', ')}, `
      })
    } else {
      out = `WITH RECURSIVE ${ctes.join(', ')} ${out}`
    }
    const conflictAt = out.search(/\bON\s+CONFLICT\b/i)
    if (conflictAt > 0) {
      const before = out.slice(0, conflictAt)
      const hasWhere = /\bWHERE\b/i.test(before.slice(before.lastIndexOf(')') + 1))
      if (!hasWhere) {
        out = `${out.slice(0, conflictAt)}WHERE 1 ${out.slice(conflictAt)}`
      }
    }
  }

  out = out.replace(/\s*FOR\s+(?:NO\s+KEY\s+)?(?:UPDATE|SHARE)(?:\s+OF\s+[A-Za-z_][A-Za-z0-9_,\s]*)?/gi, ' ')

  out = out.replace(
    /([A-Za-z0-9_$.]+)\s*\+\s*\(\s*(\$?\d+)\s*\*\s*interval\s+'\s*(\d+)\s+minute\s*'\s*\)/gi,
    (match, column, amount, minutes) =>
      `strftime('%Y-%m-%dT%H:%M:%fZ', ${column}, '+' || (${amount} * ${minutes}) || ' seconds')`,
  )

  out = out.replace(
    /([A-Za-z0-9_$.]+)\s*([+-])\s*interval\s+'\s*(\d+)\s+([A-Za-z]+)\s*'/gi,
    (match, column, operator, amount, unit) =>
      `strftime('%Y-%m-%dT%H:%M:%fZ', ${column}, '${operator}${amount} ${unit}')`,
  )

  out = out.replace(/\bnow\(\)/gi, TIMESTAMP)
  out = out.replace(
    /count\(\s*\*\s*\)\s*FILTER\s*\(\s*WHERE\s+([^()]*?)\s*\)/gi,
    (match, condition) => `sum(CASE WHEN ${condition} THEN 1 ELSE 0 END)`,
  )
  out = out.replace(/\bILIKE\b/gi, 'LIKE')
  out = out.replace(/::[A-Za-z_][A-Za-z0-9_]*(?:\s*\[\])?/g, '')
  out = out.replace(/\btrue\b/gi, '1').replace(/\bfalse\b/gi, '0')

  const plain = []
  out = out.replace(/\$(\d+)|\?/g, (match, index) => {
    if (index === undefined) {
      plain.push(plain.length + 1)
      return '?'
    }
    plain.push(Number(index))
    return '?'
  })
  out = out.replace(/__pg_any_raw_(\d+)__/g, (match, index) => `__pg_any_in_${index}__`)

  return { sql: out, plain }
}

function bindTranslated({ sql, plain }, params = []) {
  const values = []
  let plainIndex = 0
  const finalSql = sql.replace(/\?|__pg_any_in_(\d+)__/g, (match, anyIndex) => {
    if (anyIndex === undefined) {
      const paramIndex = plain[plainIndex]
      plainIndex += 1
      values.push(paramIndex === undefined ? null : params[paramIndex - 1])
      return '?'
    }
    const list = params[Number(anyIndex) - 1]
    const array = Array.isArray(list) ? list : [list]
    for (const item of array) values.push(item)
    return array.length > 0 ? `IN (${array.map(() => '?').join(', ')})` : 'IN (NULL)'
  })
  return { sql: finalSql, values }
}

function isMultiStatement(sql) {
  const withoutStrings = sql.replace(/'[^']*'/g, "''")
  return withoutStrings.split(';').filter((part) => part.trim()).length > 1
}

function createSqliteClient(database, transactionLock) {
  return {
    async query(text, params = []) {
      const translated = translate(text)
      const statement = translated.sql

      if (/^\s*BEGIN\b/i.test(statement)) {
        await transactionLock.acquire()
        database.exec('BEGIN')
        return { rows: [], rowCount: 0 }
      }
      if (/^\s*(COMMIT|ROLLBACK)\b/i.test(statement)) {
        try {
          database.exec(statement)
        } finally {
          transactionLock.release()
        }
        return { rows: [], rowCount: 0 }
      }
      if (isMultiStatement(statement) && (!params || params.length === 0)) {
        database.exec(statement)
        return { rows: [], rowCount: 0 }
      }

      const { sql, values } = bindTranslated(translated, params)
      const prepared = database.prepare(sql)
      const bound = values.map((value) => normalizeValue(value))
      try {
        if (/^\s*(SELECT|PRAGMA|WITH|VALUES|EXPLAIN)/i.test(sql) || /RETURNING/i.test(sql)) {
          const rows = prepared.all(...bound)
          return { rows, rowCount: rows.length }
        }
        const result = prepared.run(...bound)
        return { rows: [], rowCount: Number(result.changes) }
      } catch (error) {
        throw toPgError(error)
      }
    },
    release() {},
  }
}

function createTransactionLock() {
  let tail = Promise.resolve()
  let held = false
  let releaseCurrent = null
  return {
    async acquire() {
      if (held) return
      held = true
      const previous = tail
      releaseCurrent = null
      tail = new Promise((resolve) => {
        releaseCurrent = resolve
      })
      await previous
    },
    release() {
      if (!held) return
      held = false
      if (releaseCurrent) {
        releaseCurrent()
        releaseCurrent = null
      }
    },
  }
}

export function createSqlitePool(config) {
  const file = config.database.file
  if (file !== ':memory:') {
    mkdirSync(path.dirname(path.resolve(file)), { recursive: true })
  }
  const database = new DatabaseSync(file)
  database.exec('PRAGMA journal_mode = WAL')
  database.exec('PRAGMA foreign_keys = ON')
  database.exec('PRAGMA busy_timeout = 5000')

  const transactionLock = createTransactionLock()
  const shared = createSqliteClient(database, transactionLock)

  return {
    driver: 'sqlite',
    database,
    on() {},
    query: (text, params = []) => shared.query(text, params),
    async connect() {
      return { query: shared.query, release: shared.release }
    },
    async end() {
      try {
        database.close()
      } catch {
        void 0
      }
    },
  }
}

export function translateSqlForSqlite(sql) {
  return translate(sql).sql
}
